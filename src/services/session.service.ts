import type { BaseMessage } from '@langchain/core/messages'
import { fetchContext as fetchUserContext } from '../ai/context.fetcher.js'

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

export async function getOrCreateSession(sessionId: string, userId: string): Promise<SessionState> {
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
  return session
}

export function hasPendingSchedule(sessionId: string): boolean {
  return sessions.get(sessionId)?.pendingSchedule !== undefined
}

export function clearSession(sessionId: string): void {
  sessions.delete(sessionId)
}

export function getActiveSessionCount(): number {
  return sessions.size
}
