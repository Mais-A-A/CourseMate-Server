import { geminiModel } from '../config/gemini.js'
import { fetchContext as fetchUserContext } from './context.fetcher.js'
import type { BaseMessage } from '@langchain/core/messages'
import { HumanMessage, AIMessage } from '@langchain/core/messages'
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts'

const SYSTEM_PROMPT = `You are an academic advisor for a university student management system called CourseMate For Palestine Polytechnic University.
You have access to the student's academic data below. Think step-by-step to ensure accuracy. Answer in the same language the student uses. This is very important so that it may affect the student's academic journey. Always be concise, helpful, and reference the student's actual data when relevant. If you don't know the answer, say you don't know. Never make up information. Always be honest and transparent about what you can and cannot do.
{studentContext}`

type SessionState = {
  history: BaseMessage[]
  studentContext: string
  lastUsed: number
}

const sessions = new Map<string, SessionState>()

const SESSION_TTL_MS = 30 * 60 * 1000

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000

const cleanupTimer = setInterval(() => {
  const now = Date.now()
  let cleaned = 0

  for (const [id, session] of sessions.entries()) {
    if (now - session.lastUsed > SESSION_TTL_MS) {
      sessions.delete(id)
      cleaned++
    }
  }

  if (cleaned > 0) {
    console.info(
      `[AdvisorService] Cleaned ${cleaned} expired session(s). Active: ${sessions.size}`,
    )
  }
}, CLEANUP_INTERVAL_MS)

cleanupTimer.unref()

function parseModelResponseContent(content: unknown): string {
  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    const text = content
      .map((part) => {
        if (typeof part === 'string') return part
        if (
          typeof part === 'object' &&
          part !== null &&
          'text' in part &&
          typeof (part as { text?: unknown }).text === 'string'
        ) {
          return (part as { text: string }).text
        }
        return ''
      })
      .join('')
      .trim()

    return text || 'I could not generate a response.'
  }

  return 'I could not generate a response.'
}

export async function getAdvisorResponse(
  sessionId: string,
  userId: string,
  message: string,
): Promise<string> {
  if (!sessions.has(sessionId)) {
    let studentContext: string

    try {
      studentContext = await fetchUserContext(userId)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to load student context: ${msg}`)
    }

    sessions.set(sessionId, {
      history: [],
      studentContext,
      lastUsed: Date.now(),
    })
  }

  const session = sessions.get(sessionId)!
  session.lastUsed = Date.now()

  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      SYSTEM_PROMPT.replace('{studentContext}', session.studentContext),
    ],
    new MessagesPlaceholder('history'),
    ['human', '{input}'],
  ])

  const messages = await prompt.formatMessages({
    history: session.history,
    input: message,
  })

  let aiMessage: Awaited<ReturnType<typeof geminiModel.invoke>>

  try {
    aiMessage = await geminiModel.invoke(messages)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`AI model error: ${msg}`)
  }

  session.history.push(new HumanMessage(message), aiMessage)

  const response = parseModelResponseContent(aiMessage.content)

  if (!response || response === 'I could not generate a response.') {
    throw new Error('AI model returned an empty response')
  }

  return response
}

export function clearSession(sessionId: string): void {
  sessions.delete(sessionId)
}

export function getActiveSessionCount(): number {
  return sessions.size
}
export async function* getAdvisorResponseStream(
  sessionId: string,
  userId: string,
  message: string,
): AsyncGenerator<string> {
  if (!sessions.has(sessionId)) {
    let studentContext: string

    try {
      studentContext = await fetchUserContext(userId)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to load student context: ${msg}`)
    }

    sessions.set(sessionId, {
      history: [],
      studentContext,
      lastUsed: Date.now(),
    })
  }

  const session = sessions.get(sessionId)!
  session.lastUsed = Date.now()

  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      SYSTEM_PROMPT.replace('{studentContext}', session.studentContext),
    ],
    new MessagesPlaceholder('history'),
    ['human', '{input}'],
  ])

  const messages = await prompt.formatMessages({
    history: session.history,
    input: message,
  })

  let fullResponse = ''
  try {
    let stream = await geminiModel.stream(messages)

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
  if (!fullResponse) {
    throw new Error('AI model returned an empty response')
  }
  session.history.push(new HumanMessage(message), new AIMessage(fullResponse))
}
