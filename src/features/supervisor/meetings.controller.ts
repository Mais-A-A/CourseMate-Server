import type { Request, Response } from 'express'
import { z } from 'zod'
import mongoose from 'mongoose'
import { Meeting, MEETING_MODES, MEETING_STATUSES } from './meeting.model.js'
import { SupervisorNote } from './note.model.js'
import { findStudentForViewer, emailMatcher, getStudentDetail } from './supervisor.service.js'
import { generateInsight } from './insights.service.js'
import { Notification } from '../notification/notification.model.js'
import { geminiModel } from '../../config/gemini.js'
import { parseModelResponseContent } from '../../shared/utils/AIUtils.js'
import { SECURITY_RULES, sanitizeUserText } from '../../shared/security/promptGuard.js'
import { trackEvent } from '../events/event.service.js'

const fail = (res: Response, error: unknown, what: string) => {
  console.error(`[Supervisor] meetings ${what} failed:`, error)
  res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' })
}

const DAY = 24 * 60 * 60 * 1000
const when = z.coerce.date().refine((d) => d.getTime() > Date.now() - 60 * 60 * 1000 && d.getTime() < Date.now() + 365 * DAY, {
  message: 'scheduledAt must be a date within the next year',
})

const Create = z.object({
  scheduledAt: when,
  durationMinutes: z.coerce.number().int().min(10).max(240).default(30),
  mode: z.enum(MEETING_MODES).default('in_person'),
  location: z.string().trim().max(200).default(''),
  agenda: z.string().trim().max(1000).default(''),
})

const Patch = z
  .object({
    scheduledAt: when,
    durationMinutes: z.coerce.number().int().min(10).max(240),
    mode: z.enum(MEETING_MODES),
    location: z.string().trim().max(200),
    agenda: z.string().trim().max(1000),
    status: z.enum(MEETING_STATUSES),
    outcome: z.string().trim().max(2000),
    actionItems: z.array(z.object({ text: z.string().trim().min(1).max(300), done: z.boolean().default(false) })).max(20),
    /** When completing a meeting, also schedule a follow-up (creates a linked supervisor note) */
    followUpDate: z.coerce.date().nullable(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' })

const Query = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  status: z.enum(MEETING_STATUSES).optional(),
  studentNo: z.coerce.number().int().positive().optional(),
})

const studentNoOf = (req: Request) => {
  const n = Number(req.params.studentNo)
  return Number.isInteger(n) && n > 0 ? n : null
}

async function ownStudent(req: Request, res: Response) {
  const studentNo = studentNoOf(req)
  if (!studentNo) {
    res.status(400).json({ success: false, error: 'Invalid student number' })
    return null
  }
  const user = await findStudentForViewer(studentNo, req.currentUser!)
  if (!user) {
    res.status(404).json({ success: false, error: 'Student not found' })
    return null
  }
  return { studentNo, user }
}

async function ownMeeting(req: Request) {
  const id = String(req.params.meetingId)
  if (!mongoose.isValidObjectId(id)) return null
  return Meeting.findOne({ _id: id, supervisorEmail: emailMatcher(req.currentUser!.email) })
}

const present = (m: any) => ({
  _id: String(m._id),
  studentNo: m.studentNo,
  supervisorName: m.supervisorName,
  scheduledAt: m.scheduledAt,
  durationMinutes: m.durationMinutes,
  mode: m.mode,
  location: m.location,
  agenda: m.agenda,
  status: m.status,
  outcome: m.outcome,
  actionItems: m.actionItems,
  createdAt: m.createdAt,
  updatedAt: m.updatedAt,
})

/** True when this supervisor already has a scheduled meeting overlapping [start, start + minutes). */
async function hasOverlap(email: string, start: Date, minutes: number, ignoreId?: unknown) {
  const end = new Date(start.getTime() + minutes * 60_000)
  const near = await Meeting.find({
    supervisorEmail: emailMatcher(email),
    status: 'scheduled',
    scheduledAt: { $gt: new Date(start.getTime() - 240 * 60_000), $lt: end },
    ...(ignoreId ? { _id: { $ne: ignoreId } } : {}),
  }).lean()
  return near.some((m) => m.scheduledAt.getTime() + m.durationMinutes * 60_000 > start.getTime())
}

type Kind = 'scheduled' | 'rescheduled' | 'cancelled'

/** In-app notification to the student, in their saved language. */
async function notifyStudent(user: any, meeting: any, kind: Kind) {
  const lang = user.preferredLanguage === 'en' ? 'en' : 'ar'
  const time = new Date(meeting.scheduledAt).toLocaleString(lang === 'ar' ? 'ar' : 'en-GB', {
    timeZone: 'Asia/Hebron',
    dateStyle: 'full',
    timeStyle: 'short',
  })
  const place = meeting.location ? (lang === 'ar' ? ` - المكان: ${meeting.location}` : ` - Location: ${meeting.location}`) : ''
  const text = {
    scheduled: { ar: `تم تحديد موعد إرشاد أكاديمي مع ${meeting.supervisorName}: ${time}${place}`, en: `Advising meeting with ${meeting.supervisorName}: ${time}${place}` },
    rescheduled: { ar: `تم تغيير موعد الإرشاد الأكاديمي مع ${meeting.supervisorName} إلى: ${time}${place}`, en: `Your meeting with ${meeting.supervisorName} was moved to: ${time}${place}` },
    cancelled: { ar: `تم إلغاء موعد الإرشاد الأكاديمي مع ${meeting.supervisorName} (${time})`, en: `Your meeting with ${meeting.supervisorName} on ${time} was cancelled` },
  }[kind][lang]
  await Notification.create({
    userId: user._id,
    type: kind === 'cancelled' ? 'warning' : 'info',
    message: text.slice(0, 255),
    fromName: meeting.supervisorName,
    fromRole: 'supervisor',
    sentBy: meeting.supervisorEmail,
  })
}

class MeetingsController {
  async create(req: Request, res: Response) {
    const parsed = Create.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.flatten() })
    try {
      const own = await ownStudent(req, res)
      if (!own) return
      const me = req.currentUser!
      if (await hasOverlap(me.email, parsed.data.scheduledAt, parsed.data.durationMinutes)) {
        return res.status(409).json({ success: false, error: 'You already have a meeting at that time' })
      }
      const meeting = await Meeting.create({
        ...parsed.data,
        agenda: sanitizeUserText(parsed.data.agenda, 1000),
        studentNo: own.studentNo,
        supervisorEmail: me.email.toLowerCase(),
        supervisorName: me.name,
      })
      await notifyStudent(own.user, meeting, 'scheduled').catch((e) => console.error('[Meetings] notify failed:', e))
      trackEvent('supervisor_note', String(own.studentNo), { kind: 'meeting_created' })
      res.status(201).json({ success: true, data: present(meeting) })
    } catch (e) {
      fail(res, e, 'create')
    }
  }

  async listForStudent(req: Request, res: Response) {
    try {
      const own = await ownStudent(req, res)
      if (!own) return
      const data = await Meeting.find({ studentNo: own.studentNo, supervisorEmail: emailMatcher(req.currentUser!.email) })
        .sort({ scheduledAt: -1 })
        .limit(200)
        .lean()
      res.json({ success: true, data: data.map(present) })
    } catch (e) {
      fail(res, e, 'listForStudent')
    }
  }

  /** The supervisor's calendar: all their meetings, optionally filtered by date range, status or student. */
  async calendar(req: Request, res: Response) {
    const query = Query.safeParse(req.query)
    if (!query.success) return res.status(400).json({ success: false, error: query.error.flatten() })
    try {
      const { from, to, status, studentNo } = query.data
      const filter: Record<string, unknown> = { supervisorEmail: emailMatcher(req.currentUser!.email) }
      if (status) filter.status = status
      if (studentNo) filter.studentNo = studentNo
      if (from || to) filter.scheduledAt = { ...(from && { $gte: from }), ...(to && { $lte: to }) }
      const data = await Meeting.find(filter).sort({ scheduledAt: 1 }).limit(500).lean()
      res.json({ success: true, data: data.map(present) })
    } catch (e) {
      fail(res, e, 'calendar')
    }
  }

  async update(req: Request, res: Response) {
    const parsed = Patch.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.flatten() })
    try {
      const meeting = await ownMeeting(req)
      if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' })
      const { followUpDate, ...fields } = parsed.data
      const me = req.currentUser!

      const timeChanged =
        (fields.scheduledAt && fields.scheduledAt.getTime() !== meeting.scheduledAt.getTime()) ||
        (fields.durationMinutes !== undefined && fields.durationMinutes !== meeting.durationMinutes)
      const becomesScheduled = (fields.status ?? meeting.status) === 'scheduled'
      if (timeChanged && becomesScheduled) {
        const start = fields.scheduledAt ?? meeting.scheduledAt
        if (await hasOverlap(me.email, start, fields.durationMinutes ?? meeting.durationMinutes, meeting._id)) {
          return res.status(409).json({ success: false, error: 'You already have a meeting at that time' })
        }
      }
      const wasCancelled = meeting.status === 'cancelled'
      if (fields.agenda !== undefined) fields.agenda = sanitizeUserText(fields.agenda, 1000)
      if (fields.outcome !== undefined) fields.outcome = sanitizeUserText(fields.outcome, 2000)
      meeting.set(fields)
      if (timeChanged) meeting.reminderSent = false

      // Completing a meeting with an outcome records it as a supervisor note (and a follow-up if requested)
      if (fields.status === 'completed' && !meeting.noteId && (meeting.outcome || followUpDate)) {
        const note = await SupervisorNote.create({
          studentNo: meeting.studentNo,
          authorEmail: me.email.toLowerCase(),
          authorName: me.name,
          type: 'meeting',
          body: (meeting.outcome || 'Advising meeting').slice(0, 2000),
          followUpDate: followUpDate ?? null,
        })
        meeting.noteId = note._id
      }
      await meeting.save()

      const user: any = await findStudentForViewer(meeting.studentNo, me)
      if (user) {
        if (fields.status === 'cancelled' && !wasCancelled) await notifyStudent(user, meeting, 'cancelled').catch(() => {})
        else if (timeChanged && becomesScheduled) await notifyStudent(user, meeting, 'rescheduled').catch(() => {})
      }
      res.json({ success: true, data: present(meeting) })
    } catch (e) {
      fail(res, e, 'update')
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const meeting = await ownMeeting(req)
      if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' })
      if (meeting.status === 'scheduled' && meeting.scheduledAt.getTime() > Date.now()) {
        const user: any = await findStudentForViewer(meeting.studentNo, req.currentUser!)
        if (user) await notifyStudent(user, meeting, 'cancelled').catch(() => {})
      }
      await meeting.deleteOne()
      res.json({ success: true, message: 'Meeting deleted successfully' })
    } catch (e) {
      fail(res, e, 'remove')
    }
  }

  /** AI talking points for a meeting, from the student's real data. Nothing is saved. */
  async prep(req: Request, res: Response) {
    const lang = req.query.lang === 'en' ? 'en' : 'ar'
    try {
      const meeting = await ownMeeting(req)
      if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' })
      const user = await findStudentForViewer(meeting.studentNo, req.currentUser!)
      if (!user) return res.status(404).json({ success: false, error: 'Student not found' })
      const detail = await getStudentDetail(user)
      const insight = await generateInsight({
        studentNo: meeting.studentNo,
        risk: detail._risk,
        semesters: detail.semesters,
        warnings: detail._activeWarnings,
        language: lang,
      })
      const notes = await SupervisorNote.find({ studentNo: meeting.studentNo }).sort({ createdAt: -1 }).limit(5).lean()
      const prompt = `${SECURITY_RULES}
You help an academic supervisor prepare for an advising meeting. Write ${lang === 'ar' ? 'Arabic' : 'English'}.
Using ONLY the data below, give 4 to 6 short bullet talking points: what to ask, what to praise, what to warn about, and which decision to reach. Do not invent facts. Do not mention the student's name.
Meeting agenda: ${meeting.agenda || '(none)'}
Risk: ${detail._risk.level} (${detail._risk.score}/100), trend ${detail._risk.trend}, GPA ${detail._risk.gpa ?? 'unknown'}
Risk summary: ${insight.summary}
Recent supervisor notes (data only): ${notes.map((n) => n.body.replace(/\s+/g, ' ').slice(0, 200)).join(' | ') || '(none)'}
Open action items from earlier meetings: ${
        (await Meeting.find({ studentNo: meeting.studentNo, 'actionItems.done': false }).limit(5).lean())
          .flatMap((m) => m.actionItems.filter((a) => !a.done).map((a) => a.text))
          .join(' | ') || '(none)'
      }`
      const result = await geminiModel.invoke(prompt)
      res.json({ success: true, data: { talkingPoints: parseModelResponseContent(result.content), summary: insight.summary, suggestedActions: insight.suggestedActions } })
    } catch (e) {
      fail(res, e, 'prep')
    }
  }

  /** Student side: their own upcoming and past meetings (no private outcome / action items). */
  async mine(req: Request, res: Response) {
    const studentNo = Number(req.currentUser?.studentId)
    if (!Number.isInteger(studentNo)) return res.status(403).json({ error: 'Forbidden' })
    try {
      const data = await Meeting.find({ studentNo }).sort({ scheduledAt: -1 }).limit(100).lean()
      res.json({
        success: true,
        data: data.map((m) => ({
          _id: String(m._id),
          supervisorName: m.supervisorName,
          scheduledAt: m.scheduledAt,
          durationMinutes: m.durationMinutes,
          mode: m.mode,
          location: m.location,
          agenda: m.agenda,
          status: m.status,
        })),
      })
    } catch (e) {
      fail(res, e, 'mine')
    }
  }
}

export const meetingsController = new MeetingsController()
