import type { Request, Response } from 'express'
import { z } from 'zod'
import { SupervisorNote, NOTE_TYPES } from './note.model.js'
import { findStudentForViewer, emailMatcher } from './supervisor.service.js'
import { notifyStudents, listSent, MAX_RECIPIENTS } from './notify.service.js'
import { sanitizeUserText } from '../../shared/security/promptGuard.js'
import { trackEvent } from '../events/event.service.js'
import { NOTIFICATION_TYPES } from '../notification/notification.schemas.js'

const DAY = 24 * 60 * 60 * 1000
const followUpDate = z.coerce
  .date()
  .refine((d) => d.getTime() > Date.now() - DAY && d.getTime() < Date.now() + 730 * DAY, {
    message: 'followUpDate must be within the next 2 years',
  })

const NoteCreate = z.object({
  body: z.string().trim().min(1).max(2000),
  type: z.enum(NOTE_TYPES).default('general'),
  followUpDate: followUpDate.optional(),
})
const NotePatch = z
  .object({
    body: z.string().trim().min(1).max(2000),
    type: z.enum(NOTE_TYPES),
    followUpDate: followUpDate.nullable(),
    followUpDone: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' })

// Supervisors may only send these; "deadline"/"system" etc. are reserved for the platform.
const SUPERVISOR_TYPES = ['info', 'warning', 'reminder', 'academic', 'success'] as const satisfies readonly (typeof NOTIFICATION_TYPES)[number][]
const NotifyOne = z.object({
  message: z.string().min(1).max(255),
  type: z.enum(SUPERVISOR_TYPES).default('info'),
})
const NotifyMany = z
  .object({
    message: z.string().min(1).max(255),
    type: z.enum(SUPERVISOR_TYPES).default('info'),
    studentNos: z.array(z.number().int().positive()).min(1).max(MAX_RECIPIENTS).optional(),
    riskLevel: z.enum(['low', 'medium', 'high', 'unknown']).optional(),
  })
  .refine((v) => (v.studentNos ? !v.riskLevel : !!v.riskLevel), {
    message: 'Provide either studentNos or riskLevel, not both',
  })

const FollowUpQuery = z.object({ status: z.enum(['due', 'upcoming', 'all']).default('all') })

const bad = (res: Response, error: z.ZodError) =>
  res.status(400).json({ success: false, error: error.flatten() })
const fail = (res: Response, error: unknown, what: string) => {
  console.error(`[Supervisor] ${what} failed:`, error)
  res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' })
}
const studentNoOf = (req: Request) => {
  const n = Number(req.params.studentNo)
  return Number.isInteger(n) && n > 0 ? n : null
}
const sender = (req: Request) => {
  const u = req.currentUser!
  return { name: u.name, email: u.email, role: 'supervisor' as const }
}
const local = (e: string) => e.trim().toLowerCase().split('@')[0]

const present = (n: any) => ({
  _id: String(n._id),
  studentNo: n.studentNo,
  type: n.type,
  body: n.body,
  authorName: n.authorName,
  authorEmail: n.authorEmail,
  followUpDate: n.followUpDate ?? null,
  followUpDone: !!n.followUpDone,
  createdAt: n.createdAt,
  updatedAt: n.updatedAt,
})

/** Loads a note the requester may see (they can view its student); 404 otherwise. */
async function loadNote(req: Request, res: Response) {
  const id = String(req.params.noteId)
  if (!/^[a-f0-9]{24}$/i.test(id)) {
    res.status(404).json({ success: false, error: 'Note not found' })
    return null
  }
  const note = await SupervisorNote.findById(id)
  if (!note || !(await findStudentForViewer(note.studentNo, req.currentUser!))) {
    res.status(404).json({ success: false, error: 'Note not found' })
    return null
  }
  return note
}

class CollabController {
  // ---- notes
  async listNotes(req: Request, res: Response) {
    const studentNo = studentNoOf(req)
    if (!studentNo) return res.status(400).json({ success: false, error: 'Invalid student number' })
    try {
      if (!(await findStudentForViewer(studentNo, req.currentUser!))) {
        return res.status(404).json({ success: false, error: 'Student not found' })
      }
      const notes = await SupervisorNote.find({ studentNo }).sort({ createdAt: -1 }).limit(200).lean()
      res.json({ success: true, data: notes.map(present) })
    } catch (e) {
      fail(res, e, 'listNotes')
    }
  }

  async createNote(req: Request, res: Response) {
    const studentNo = studentNoOf(req)
    if (!studentNo) return res.status(400).json({ success: false, error: 'Invalid student number' })
    const parsed = NoteCreate.safeParse(req.body)
    if (!parsed.success) return bad(res, parsed.error)
    try {
      if (!(await findStudentForViewer(studentNo, req.currentUser!))) {
        return res.status(404).json({ success: false, error: 'Student not found' })
      }
      const me = req.currentUser!
      const note = await SupervisorNote.create({
        studentNo,
        authorEmail: me.email.toLowerCase(),
        authorName: me.name,
        type: parsed.data.type,
        body: sanitizeUserText(parsed.data.body, 2000),
        followUpDate: parsed.data.followUpDate ?? null,
      })
      trackEvent('supervisor_note', String(studentNo), { type: parsed.data.type, hasFollowUp: !!parsed.data.followUpDate })
      res.status(201).json({ success: true, data: present(note) })
    } catch (e) {
      fail(res, e, 'createNote')
    }
  }

  async updateNote(req: Request, res: Response) {
    const parsed = NotePatch.safeParse(req.body)
    if (!parsed.success) return bad(res, parsed.error)
    try {
      const note = await loadNote(req, res)
      if (!note) return
      const me = req.currentUser!
      if (local(note.authorEmail) !== local(me.email)) {
        return res.status(403).json({ success: false, error: 'Only the author can edit this note' })
      }
      const { body, type, followUpDate: due, followUpDone } = parsed.data
      if (body !== undefined) note.body = sanitizeUserText(body, 2000)
      if (type !== undefined) note.type = type
      if (followUpDone !== undefined) note.followUpDone = followUpDone
      if (due !== undefined) {
        note.followUpDate = due
        note.reminderSent = false // a new date deserves a new reminder
      }
      await note.save()
      res.json({ success: true, data: present(note) })
    } catch (e) {
      fail(res, e, 'updateNote')
    }
  }

  async deleteNote(req: Request, res: Response) {
    try {
      const note = await loadNote(req, res)
      if (!note) return
      const me = req.currentUser!
      if (local(note.authorEmail) !== local(me.email)) {
        return res.status(403).json({ success: false, error: 'Only the author can delete this note' })
      }
      await note.deleteOne()
      res.json({ success: true })
    } catch (e) {
      fail(res, e, 'deleteNote')
    }
  }

  async followUps(req: Request, res: Response) {
    const parsed = FollowUpQuery.safeParse(req.query)
    if (!parsed.success) return bad(res, parsed.error)
    try {
      const me = req.currentUser!
      const filter: any = { followUpDone: false, followUpDate: { $ne: null } }
      // Supervisors see the follow-ups they wrote
      filter.authorEmail = emailMatcher(me.email)
      const now = new Date()
      if (parsed.data.status === 'due') filter.followUpDate = { $lte: now }
      if (parsed.data.status === 'upcoming') filter.followUpDate = { $gt: now }
      const notes = await SupervisorNote.find(filter).sort({ followUpDate: 1 }).limit(200).lean()
      res.json({
        success: true,
        data: notes.map((n) => ({ ...present(n), overdue: !!n.followUpDate && n.followUpDate <= now })),
      })
    } catch (e) {
      fail(res, e, 'followUps')
    }
  }

  // ---- notifications to students
  async notifyOne(req: Request, res: Response) {
    const studentNo = studentNoOf(req)
    if (!studentNo) return res.status(400).json({ success: false, error: 'Invalid student number' })
    const parsed = NotifyOne.safeParse(req.body)
    if (!parsed.success) return bad(res, parsed.error)
    try {
      const result = await notifyStudents({
        sender: sender(req),
        target: { studentNos: [studentNo] },
        message: parsed.data.message,
        type: parsed.data.type,
      })
      if (result.sent === 0) return res.status(404).json({ success: false, error: 'Student not found' })
      trackEvent('supervisor_notification', null, { recipients: 1, type: parsed.data.type })
      res.status(201).json({ success: true, data: { sent: result.sent } })
    } catch (e) {
      fail(res, e, 'notifyOne')
    }
  }

  async notifyMany(req: Request, res: Response) {
    const parsed = NotifyMany.safeParse(req.body)
    if (!parsed.success) return bad(res, parsed.error)
    const { studentNos, riskLevel, message, type } = parsed.data
    try {
      const result = await notifyStudents({
        sender: sender(req),
        target: studentNos ? { studentNos } : { riskLevel: riskLevel! },
        message,
        type,
      })
      if (result.sent > 0) trackEvent('supervisor_notification', null, { recipients: result.sent, type })
      res.status(result.sent > 0 ? 201 : 200).json({
        success: true,
        data: { sent: result.sent, skippedStudentNos: result.skippedStudentNos },
      })
    } catch (e) {
      fail(res, e, 'notifyMany')
    }
  }

  async sent(req: Request, res: Response) {
    try {
      const limit = Math.min(Math.max(Math.floor(Number(req.query.limit ?? 50)) || 50, 1), 200)
      res.json({ success: true, data: await listSent(req.currentUser!.email, limit) })
    } catch (e) {
      fail(res, e, 'sent')
    }
  }
}

export const collabController = new CollabController()
export default collabController
