import type { Request, Response } from 'express'
import { classifyIntent, Intent } from './intentClassifier.js'
import {
  hasPendingSchedule,
  getOrCreateSession,
  persistSession,
  deleteSession,
  SessionForbiddenError,
  MAX_SESSION_MESSAGES,
} from './session.service.js'
import { ChatSession } from './chatSession.model.js'
import { generateAndSaveChatTitle } from './chatTitle.service.js'
import { handleAdvisorRequestStream } from './advisor.service.js'
import { generateSchedule } from './schedule.generator.js'
import { findStudentForViewer } from '../supervisor/supervisor.service.js'
import {
  startScheduleFlowStream,
  continuePendingScheduleStream,
} from './schedule.flow.js'
import { handleGeneralQuestionStream } from '../knowledge-base/knowledgeBase.service.js'
import { geminiModel } from '../../config/gemini.js'
import { parseModelResponseContent } from '../../shared/utils/AIUtils.js'
import { verifyJWT } from '../../shared/utils/authUtils.js'
import { AISchedule } from './aiSchedule.model.js'
import { HumanMessage, AIMessage } from '@langchain/core/messages'
import {
  sanitizeUserText,
  sanitizePreferences,
  detectPromptInjection,
  wrapStudentMessage,
  SECURITY_RULES,
  INJECTION_REFUSAL,
} from '../../shared/security/promptGuard.js'
import { redactSecrets } from '../../shared/security/promptGuard.js'
import { trackEvent } from '../events/event.service.js'
import { safeStream } from '../../shared/security/safeStream.js'

const CHAT_FULL_MESSAGE =
  'وصلت هذه المحادثة إلى الحد الأقصى من الرسائل. يرجى بدء محادثة جديدة للمتابعة.\nThis chat has reached its message limit. Please start a new chat to continue.'

const SERVICE_UNAVAILABLE = 'The service is temporarily unavailable. Please try again shortly.'

// Returns undefined when absent, null when blocked as a prompt injection.
function cleanPreferences(raw: unknown): string | undefined | null {
  if (typeof raw !== 'string') return undefined
  const value = sanitizePreferences(raw)
  if (!value) return undefined
  const verdict = detectPromptInjection(value)
  if (verdict.flagged) {
    console.warn(`[Security] prompt-injection blocked in schedule preferences: ${verdict.reasons.join(',')}`)
    return null
  }
  return value
}

function generationError(error: unknown): string {
  console.error('[AI] schedule generation failed:', error)
  const msg = error instanceof Error ? error.message : 'Unexpected error'
  return redactSecrets(msg).slice(0, 300)
}

export function scheduleEventMeta(
  schedule: { sections: unknown[]; totalCreditHours: number; conflictsResolved?: number | undefined },
  source: 'form' | 'chat',
) {
  return {
    source,
    sections: schedule.sections.length,
    creditHours: schedule.totalCreditHours,
    conflictsResolved: schedule.conflictsResolved ?? 0,
  }
}

/** A student may access their own data; a supervisor only their own students. Admins get no access here. */
async function canAccessStudent(req: Request, studentNo: string): Promise<boolean> {
  const user = req.currentUser
  if (!user) return false
  if (user.studentId === studentNo) return true
  if (user.role !== 'supervisor') return false
  const n = Number(studentNo)
  return Number.isInteger(n) && !!(await findStudentForViewer(n, user))
}

async function resolveStudentId(req: Request): Promise<string | null> {
  let studentId = req.currentUser?.studentId ?? null
  if (!studentId) {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null
    if (token) {
      const verified = await verifyJWT(token)
      studentId = verified?.studentId ?? null
    }
  }
  return studentId
}

export async function chat(req: Request, res: Response) {
  const studentId = await resolveStudentId(req)

  if (!studentId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const { sessionId } = req.body
  const message = sanitizeUserText(String(req.body.message ?? ''))
  if (!message) {
    res.status(400).json({ error: 'Message is empty' })
    return
  }

  let session
  try {
    session = await getOrCreateSession(sessionId, studentId)
  } catch (error) {
    if (error instanceof SessionForbiddenError) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    console.error('[Chat] failed to open session:', error)
    res.status(503).json({ error: SERVICE_UNAVAILABLE })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  if (session.history.length >= MAX_SESSION_MESSAGES) {
    trackEvent('chat_limit_reached', studentId)
    res.write(`data: ${JSON.stringify({ text: CHAT_FULL_MESSAGE, limitReached: true })}\n\n`)
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
    res.end()
    return
  }

  trackEvent('chat_message', studentId)
  const verdict = detectPromptInjection(message)
  const historyLengthBefore = session.history.length

  try {
    let stream: AsyncGenerator<string>

    if (verdict.flagged) {
      trackEvent('injection_blocked', studentId, { reasons: verdict.reasons })
      console.warn(
        `[Security] prompt-injection blocked user="${studentId}" session="${sessionId}" reasons=${verdict.reasons.join(',')}`,
      )
      // The raw text is not kept in history so it can't influence later turns.
      session.history.push(
        new HumanMessage('(تم حجب هذه الرسالة لأسباب أمنية / message blocked)'),
        new AIMessage(INJECTION_REFUSAL),
      )
      stream = (async function* () {
        yield INJECTION_REFUSAL
      })()
    } else if (hasPendingSchedule(sessionId)) {
      stream = continuePendingScheduleStream(sessionId, studentId, message)
    } else {
      const intent = await classifyIntent(message).catch(() => Intent.OTHER)
      trackEvent('intent', studentId, { intent })

      console.log(`[Chat] intent="${intent}" session="${sessionId}"`)

      switch (intent) {
        case Intent.GENERATE_SCHEDULE:
          stream = startScheduleFlowStream(sessionId, studentId, message)
          break
        case Intent.ADVISOR_REQUEST:
          stream = handleAdvisorRequestStream(sessionId, studentId, message)
          break
        case Intent.GENERAL_UNI_QUESTION:
          stream = handleGeneralQuestionStream(sessionId, studentId, message)
          break
        case Intent.GREETING:
          stream = (async function* () {
            yield 'أهلاً وسهلاً! 👋 أنا CourseMate، مساعدك الأكاديمي في جامعة بوليتكنك فلسطين.\nيمكنني مساعدتك في:\n- 📅 إنشاء جدولك الدراسي\n- 📚 الإجابة على أسئلتك حول الجامعة\n- 🎓 معلومات وضعك الأكاديمي\n\nكيف يمكنني مساعدتك اليوم؟'
          })()
          break
        default:
          stream = (async function* () {
            const result = await geminiModel.invoke(
              `${SECURITY_RULES}\n\n${wrapStudentMessage(message)}\nRespond in the SAME LANGUAGE as the student's message. Tell them in ONE short sentence that you can only assist with academic matters at Palestine Polytechnic University (PPU).`,
            )
            yield parseModelResponseContent(result.content)
          })()
      }
    }

    let reply = ''
    for await (const chunk of safeStream(stream, `session=${sessionId}`, () =>
      trackEvent('ai_failure', studentId, { source: 'chat' }),
    )) {
      reply += chunk
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`)
    }
    // Greetings, off-topic answers and failures bypass the services that record the turn: record it here.
    if (session.history.length === historyLengthBefore && reply) {
      session.history.push(new HumanMessage(message), new AIMessage(reply))
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
  } catch (error) {
    // safeStream handles model/DB failures; this only catches unexpected errors (e.g. the intent step).
    console.error('[Chat] unexpected error:', error)
    res.write(`data: ${JSON.stringify({ error: SERVICE_UNAVAILABLE })}\n\n`)
  } finally {
    const saved = await persistSession(sessionId).catch((e) => {
      console.error('[Chat] failed to persist session', e)
      return null
    })
    res.end()
    if (saved?.firstExchange && !verdict.flagged) {
      void generateAndSaveChatTitle(
        sessionId,
        saved.firstExchange.user,
        saved.firstExchange.assistant,
      )
    }
  }
}

export async function listSessionsHandler(req: Request, res: Response): Promise<void> {
  const studentId = await resolveStudentId(req)
  if (!studentId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    const sessions = await ChatSession.aggregate([
      { $match: { studentNo: studentId } },
      { $sort: { lastMessageAt: -1 } },
      { $limit: 100 },
      {
        $project: {
          _id: 0,
          sessionId: 1,
          title: 1,
          lastMessageAt: 1,
          createdAt: 1,
          messageCount: { $size: '$messages' },
          lastMessage: { $arrayElemAt: ['$messages.content', -1] },
        },
      },
    ])
    res.status(200).json({ success: true, data: sessions })
  } catch (error) {
    console.error('[AI]', error)
    res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' })
  }
}

export async function getSessionHandler(req: Request, res: Response): Promise<void> {
  const studentId = await resolveStudentId(req)
  if (!studentId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    const session = await ChatSession.findOne({
      sessionId: String(req.params.sessionId),
      studentNo: studentId,
    })
      .select('-_id sessionId title messages lastMessageAt createdAt pendingSchedule')
      .lean()
    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' })
      return
    }
    res.status(200).json({
      success: true,
      data: { ...session, messageLimit: MAX_SESSION_MESSAGES },
    })
  } catch (error) {
    console.error('[AI]', error)
    res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' })
  }
}

export async function renameSessionHandler(req: Request, res: Response): Promise<void> {
  const studentId = await resolveStudentId(req)
  if (!studentId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    const updated = await ChatSession.findOneAndUpdate(
      { sessionId: String(req.params.sessionId), studentNo: studentId },
      { title: req.body.title, titleIsAuto: false },
      { returnDocument: 'after' },
    )
      .select('-_id sessionId title')
      .lean()
    if (!updated) {
      res.status(404).json({ success: false, error: 'Session not found' })
      return
    }
    res.status(200).json({ success: true, data: updated })
  } catch (error) {
    console.error('[AI]', error)
    res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' })
  }
}

export async function deleteSessionHandler(req: Request, res: Response): Promise<void> {
  const studentId = await resolveStudentId(req)
  if (!studentId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    const sessionId = String(req.params.sessionId)
    const deleted = await deleteSession(sessionId, studentId)
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Session not found' })
      return
    }
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('[AI]', error)
    res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' })
  }
}

export async function approveScheduleHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = await resolveStudentId(req)
  if (!studentId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const target = await AISchedule.findOne({ studentNo: studentId, status: 'pending' }).sort({ createdAt: -1 })
    if (!target) {
      res.status(404).json({ success: false, error: 'No pending schedule found' })
      return
    }

    await AISchedule.deleteMany({
      studentNo: studentId,
      acdYear: target.acdYear,
      semesterNo: target.semesterNo,
      _id: { $ne: target._id },
    })
    target.status = 'approved'
    await target.save()
    trackEvent('schedule_approved', studentId, { acdYear: target.acdYear, semesterNo: target.semesterNo })

    res.status(200).json({ success: true, data: { _id: target._id, acdYear: target.acdYear, semesterNo: target.semesterNo } })
  } catch (error) {
    console.error('[AI]', error)
    res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' })
  }
}

export async function getScheduleHistoryHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = await resolveStudentId(req)
  if (!studentId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    const history = await AISchedule.find({ studentNo: studentId }).sort({ createdAt: -1 }).lean()
    res.status(200).json({ success: true, data: history })
  } catch (error) {
    console.error('[AI]', error)
    res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' })
  }
}

export async function getApprovedScheduleHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = await resolveStudentId(req)
  if (!studentId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const { acdYear, semesterNo } = req.query

  try {
    const filter: Record<string, unknown> = { studentNo: studentId, status: 'approved' }
    if (acdYear) filter.acdYear = Number(acdYear)
    if (semesterNo) filter.semesterNo = Number(semesterNo)

    const schedule = await AISchedule.findOne(filter).sort({ acdYear: -1, semesterNo: -1 }).lean()
    if (!schedule) {
      res.status(404).json({ success: false, error: 'No approved schedule found' })
      return
    }
    res.status(200).json({ success: true, data: schedule })
  } catch (error) {
    console.error('[AI]', error)
    res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' })
  }
}

export async function generateScheduleHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = await resolveStudentId(req)

  if (!studentId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const { acdYear, semesterNo } = req.body
  const preferences = cleanPreferences(req.body.preferences)
  if (preferences === null) {
    res.status(400).json({ success: false, error: INJECTION_REFUSAL })
    return
  }

  try {
    const schedule = await generateSchedule({
      userId: studentId,
      acdYear,
      semesterNo,
      preferences,
    })

    const saved = await AISchedule.create({ ...schedule, studentNo: studentId, status: 'pending' })
    trackEvent('schedule_generated', studentId, scheduleEventMeta(schedule, 'form'))

    res.status(200).json({ success: true, data: { ...schedule, _id: saved._id } })
  } catch (error) {
    res.status(500).json({ success: false, error: generationError(error) })
  }
}

export async function getStudentScheduleHandler(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.currentUser) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const studentNo = String(req.params.studentNo)
  const { acdYear, semesterNo } = req.query

  if (!(await canAccessStudent(req, studentNo))) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  try {
    const filter: Record<string, unknown> = { studentNo, status: 'approved' }
    if (acdYear) filter.acdYear = Number(acdYear)
    if (semesterNo) filter.semesterNo = Number(semesterNo)

    const schedule = await AISchedule.findOne(filter).sort({ acdYear: -1, semesterNo: -1 }).lean()
    if (!schedule) {
      res.status(404).json({ success: false, error: 'No approved schedule found for this student' })
      return
    }
    res.status(200).json({ success: true, data: schedule })
  } catch (error) {
    console.error('[AI]', error)
    res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' })
  }
}

export async function generateScheduleForStudentHandler(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.currentUser) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (req.currentUser.role !== 'supervisor') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const { studentId, acdYear, semesterNo } = req.body
  const preferences = cleanPreferences(req.body.preferences)
  if (preferences === null) {
    res.status(400).json({ success: false, error: INJECTION_REFUSAL })
    return
  }

  const parsedYear = Number(acdYear)
  const parsedSemester = Number(semesterNo)

  if (!studentId || isNaN(parsedYear) || isNaN(parsedSemester)) {
    res.status(400).json({ error: 'studentId, acdYear and semesterNo are required' })
    return
  }

  if (!(await canAccessStudent(req, String(studentId)))) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  try {
    const schedule = await generateSchedule({
      userId: studentId,
      acdYear: parsedYear,
      semesterNo: parsedSemester,
      preferences,
    })

    res.status(200).json({ success: true, data: schedule })
  } catch (error) {
    res.status(500).json({ success: false, error: generationError(error) })
  }
}
