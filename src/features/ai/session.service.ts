import { AIMessage, HumanMessage, type BaseMessage } from '@langchain/core/messages'
import { ChatSession } from './chatSession.model.js'
import { fetchContext as fetchUserContext } from './context.fetcher.js'

export type PendingSchedule = {
  acdYear?: number
  semesterNo?: number
  preferences?: string
  waitingForPreferences?: boolean
}

export type SessionState = {
  history: BaseMessage[]
  studentContext: string
  lastUsed: number
  pendingSchedule?: PendingSchedule
  userId: string
  persistedCount: number
}

/** Hard cap on messages (user + assistant) per chat; after it the student is asked to start a new chat. */
export const MAX_SESSION_MESSAGES = 100

const HISTORY_TOKEN_BUDGET = 6000
const HISTORY_MAX_MESSAGES = 30
const CHARS_PER_TOKEN = 3 // conservative for Arabic and English mixed text

const estimateTokens = (m: BaseMessage) =>
  Math.ceil((typeof m.content === 'string' ? m.content : JSON.stringify(m.content)).length / CHARS_PER_TOKEN)

/**
 * The part of the conversation sent to the model: the newest messages that fit the token budget
 * (and at most HISTORY_MAX_MESSAGES). The full transcript stays in `session.history` and in MongoDB.
 */
export function getModelHistory(session: Pick<SessionState, 'history'>): BaseMessage[] {
  const window: BaseMessage[] = []
  let tokens = 0
  for (let i = session.history.length - 1; i >= 0 && window.length < HISTORY_MAX_MESSAGES; i--) {
    const m = session.history[i]!
    tokens += estimateTokens(m)
    if (tokens > HISTORY_TOKEN_BUDGET && window.length > 0) break
    window.unshift(m)
  }
  // A window must start with the student's message, not with a dangling assistant reply.
  while (window.length > 0 && !(window[0] instanceof HumanMessage)) window.shift()
  return window
}

export class SessionForbiddenError extends Error {
  constructor() {
    super('Session belongs to another user')
    this.name = 'SessionForbiddenError'
  }
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
    console.info(`[SessionService] Cleaned ${cleaned} expired session(s). Active: ${sessions.size}`)
  }
}, CLEANUP_INTERVAL_MS)

cleanupTimer.unref()

const TITLE_MAX = 60

function makeTitle(message: string): string {
  const t = message.trim().replace(/\s+/g, ' ')
  return t.length > TITLE_MAX ? `${t.slice(0, TITLE_MAX)}…` : t
}

export async function getOrCreateSession(sessionId: string, userId: string): Promise<SessionState> {
  const cached = sessions.get(sessionId)
  if (cached) {
    if (cached.userId !== userId) throw new SessionForbiddenError()
    cached.lastUsed = Date.now()
    return cached
  }

  const stored = await ChatSession.findOne({ sessionId }).lean()
  if (stored && stored.studentNo !== userId) throw new SessionForbiddenError()

  let studentContext: string
  try {
    studentContext = await fetchUserContext(userId)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to load student context: ${msg}`)
  }

  const history: BaseMessage[] = (stored?.messages ?? []).map((m) =>
    m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content),
  )
  const state: SessionState = {
    history,
    studentContext,
    lastUsed: Date.now(),
    userId,
    persistedCount: history.length,
  }
  const pending = stored?.pendingSchedule
  if (pending) {
    const { acdYear, semesterNo, preferences, waitingForPreferences } = pending
    state.pendingSchedule = {
      ...(acdYear != null && { acdYear }),
      ...(semesterNo != null && { semesterNo }),
      ...(preferences != null && { preferences }),
      ...(waitingForPreferences != null && { waitingForPreferences }),
    }
  }
  sessions.set(sessionId, state)
  return state
}

/** Writes any messages added since the last save, plus the pending-schedule state, to MongoDB. */
export async function persistSession(
  sessionId: string,
): Promise<{ firstExchange: { user: string; assistant: string } | null }> {
  const session = sessions.get(sessionId)
  if (!session) return { firstExchange: null }
  const wasEmpty = session.persistedCount === 0

  const fresh = session.history.slice(session.persistedCount)
  const now = new Date()
  const newMessages = fresh.map((m) => ({
    role: m instanceof HumanMessage ? 'user' : 'assistant',
    content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    createdAt: now,
  }))

  const update: Record<string, unknown> = {
    $set: {
      pendingSchedule: session.pendingSchedule ?? null,
      lastMessageAt: now,
    },
    $setOnInsert: {
      studentNo: session.userId,
      title: makeTitle(
        newMessages.find((m) => m.role === 'user')?.content ?? 'New chat',
      ),
    },
  }
  if (newMessages.length > 0) {
    update.$push = { messages: { $each: newMessages } }
  }

  await ChatSession.updateOne({ sessionId }, update, { upsert: true })
  session.persistedCount = session.history.length

  const user = newMessages.find((m) => m.role === 'user')?.content
  const assistant = newMessages.find((m) => m.role === 'assistant')?.content
  return {
    firstExchange: wasEmpty && user && assistant ? { user, assistant } : null,
  }
}

export function hasPendingSchedule(sessionId: string): boolean {
  return sessions.get(sessionId)?.pendingSchedule !== undefined
}

export function clearSession(sessionId: string): void {
  sessions.delete(sessionId)
}

export async function deleteSession(sessionId: string, userId: string): Promise<boolean> {
  const res = await ChatSession.deleteOne({ sessionId, studentNo: userId })
  if (res.deletedCount > 0) sessions.delete(sessionId)
  return res.deletedCount > 0
}

export function getActiveSessionCount(): number {
  return sessions.size
}
