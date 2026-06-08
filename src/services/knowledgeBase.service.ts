import { createRequire } from 'module'
import mongoose from 'mongoose'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import {
  generateEmbedding,
  generateEmbeddings,
} from '../config/geminiEmbeddings.js'
import { KnowledgeBase } from '../models/knowledgeBase.model.js'
import { geminiModel } from '../config/gemini.js'
import { HumanMessage, AIMessage } from '@langchain/core/messages'
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts'
import { parseModelResponseContent } from '../shared/utils/AIUtils.js'
import { getOrCreateSession } from './session.service.js'

const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse') as (
  buffer: Buffer,
  options?: { max?: number },
) => Promise<{ text: string }>

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 100,
  separators: ['\n\n', '\n', '.', ' ', '', '،'],
})

function removeDiacritics(text: string): string {
  return text.replace(/[ؐ-ًؚ-ٟۖ-ۜ۟-۪ۨ-ۭ]/g, '')
}

export async function ingestDocument(
  fileBuffer: Buffer,
  filename: string,
): Promise<number> {
  const pdf = await pdfParse(fileBuffer)
  const rawText = removeDiacritics(pdf.text)

  if (!rawText || rawText.trim().length === 0) {
    throw new Error('Could not extract text from PDF')
  }

  // Step 2: Split text into chunks
  const chunks = await splitter.splitText(rawText)

  // Step 3: Generate embeddings for all chunks
  const embeddings = await generateEmbeddings(chunks)

  // Step 4: Save chunks + embeddings to MongoDB
  const documents = chunks.map((chunk, i) => ({
    text: chunk,
    embedding: embeddings[i],
    source: filename,
  }))

  await KnowledgeBase.insertMany(documents)

  return documents.length
}

export async function retrieveContext(
  question: string,
  topK = 5,
): Promise<string[]> {
  const questionEmbedding = await generateEmbedding(question)
  const collection = mongoose.connection.db!.collection('knowledgebases')
  const cleanQuestion = removeDiacritics(question)

  const [vectorResults, textResults] = await Promise.all([
    // Vector search — semantic similarity
    collection
      .aggregate([
        {
          $vectorSearch: {
            index: 'vector_search',
            path: 'embedding',
            queryVector: questionEmbedding,
            numCandidates: 100,
            limit: topK,
          },
        },
        { $project: { text: 1, _id: 0 } },
      ])
      .toArray(),

    // Text search — exact keyword match
    collection
      .aggregate([
        {
          $search: {
            index: 'text_search',
            text: { query: cleanQuestion, path: 'text' },
          },
        },
        { $limit: topK },
        { $project: { text: 1, _id: 0 } },
      ])
      .toArray()
      .catch(() => []), // fallback if text index not ready
  ])

  // mergee and deduplicate, vector results first (higher priority)
  const seen = new Set<string>()
  const merged: string[] = []

  for (const doc of [...vectorResults, ...textResults]) {
    const text = doc['text'] as string
    if (!seen.has(text)) {
      seen.add(text)
      merged.push(text)
    }
  }

  return merged
}

const RAG_SYSTEM_PROMPT = `You are a helpful university assistant for Palestine Polytechnic University (CourseMate).
Answer questions about university policies, regulations, departments, fees, and academic information.
Answer in the same language the student uses. Be concise and accurate. If you don't know, say so.`

export async function* handleGeneralQuestionStream(
  sessionId: string,
  userId: string,
  message: string,
): AsyncGenerator<string> {
  const session = await getOrCreateSession(sessionId, userId)

  let augmentedMessage = message
  try {
    const ragContext = await retrieveContext(message, 5)
    console.log(`[RAG] retrieved ${ragContext.length} chunks for: "${message}"`)
    console.log(
      '[RAG] chunks:',
      ragContext.map((c, i) => `[${i}] ${c.slice(0, 100)}`),
    )
    if (ragContext.length === 0) {
      yield 'لا أملك معلومات كافية للإجابة على هذا السؤال. يرجى التواصل مع الجامعة مباشرة للحصول على معلومات دقيقة.'
      return
    }
    augmentedMessage = `[معلومات ذات صلة من قاعدة معرفة الجامعة]\n${ragContext.join('\n\n---\n\n')}\n\n[سؤال الطالب]\n${message}`
  } catch {
    console.log(`[RAG] retrieval failed, continuing without context`)
    yield 'حدث خطأ في استرجاع المعلومات. يرجى المحاولة لاحقاً.'
    return
  }

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', RAG_SYSTEM_PROMPT],
    new MessagesPlaceholder('history'),
    ['human', '{input}'],
  ])

  const messages = await prompt.formatMessages({
    history: session.history,
    input: augmentedMessage,
  })

  let fullResponse = ''
  try {
    const stream = await geminiModel.stream(messages)
    for await (const chunk of stream) {
      const content = parseModelResponseContent(chunk.content)
      if (content) {
        fullResponse += content
        yield content
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`AI model error: ${msg}`)
  }

  if (!fullResponse) throw new Error('AI model returned an empty response')
  session.history.push(new HumanMessage(message), new AIMessage(fullResponse))
}
