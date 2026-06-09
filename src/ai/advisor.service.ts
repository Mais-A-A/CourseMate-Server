import { geminiModel } from '../config/gemini.js'
import { HumanMessage, AIMessage } from '@langchain/core/messages'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { parseModelResponseContent } from '../shared/utils/AIUtils.js'
import { getOrCreateSession } from '../services/session.service.js'

const SYSTEM_PROMPT = `You are an academic advisor for a university student management system called CourseMate For Palestine Polytechnic University.
You have access to the student's academic data below. Think step-by-step to ensure accuracy. Answer in the same language the student uses. This is very important so that it may affect the student's academic journey. Always be concise, helpful, and reference the student's actual data when relevant. If you don't know the answer, say you don't know. Never make up information. Always be honest and transparent about what you can and cannot do.
Student Academic Data:
{studentContext}`

export async function* handleAdvisorRequestStream(
  sessionId: string,
  userId: string,
  message: string,
): AsyncGenerator<string> {
  const session = await getOrCreateSession(sessionId, userId)

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', SYSTEM_PROMPT.replace('{studentContext}', session.studentContext)],
    new MessagesPlaceholder('history'),
    ['human', '{input}'],
  ])

  const messages = await prompt.formatMessages({
    history: session.history,
    input: message,
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
