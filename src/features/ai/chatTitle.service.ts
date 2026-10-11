import { geminiModel } from '../../config/gemini.js'
import { parseModelResponseContent } from '../../shared/utils/AIUtils.js'
import { ChatSession } from './chatSession.model.js'

const TITLE_PROMPT = `Write a short title (3 to 6 words) that captures the topic of this chat between a university student and an academic assistant.
Use the SAME LANGUAGE as the student's message. Return ONLY the title: no quotes, no trailing punctuation, no explanation.

Student: {USER}
Assistant: {ASSISTANT}`

function cleanTitle(raw: string): string {
  const t = raw
    .split('\n')[0]!
    .replace(/^["'“”«»`*#\s]+|["'“”«»`*\s.:،]+$/g, '')
    .trim()
  return t.length > 60 ? `${t.slice(0, 60)}…` : t
}

/**
 * Generates a topic title for a chat and saves it, unless the student renamed the chat meanwhile.
 * Never throws: on any failure the fallback title (truncated first message) is kept.
 */
export async function generateAndSaveChatTitle(
  sessionId: string,
  userMessage: string,
  assistantReply: string,
): Promise<void> {
  try {
    const prompt = TITLE_PROMPT.replace('{USER}', userMessage.slice(0, 300)).replace(
      '{ASSISTANT}',
      assistantReply.slice(0, 300),
    )
    const result = await geminiModel.invoke(prompt)
    const title = cleanTitle(parseModelResponseContent(result.content))
    if (!title) return
    await ChatSession.updateOne({ sessionId, titleIsAuto: true }, { title })
  } catch (error) {
    console.error('[ChatTitle] generation failed', error)
  }
}
