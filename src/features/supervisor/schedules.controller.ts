import type { Request, Response } from 'express'
import { z } from 'zod'
import mongoose from 'mongoose'
import { findStudentForViewer } from './supervisor.service.js'
import { AISchedule } from '../ai/aiSchedule.model.js'
import { scheduledSectionSchema } from '../ai/aiSchedule.schema.js'
import { generateSchedule } from '../ai/schedule.generator.js'
import { detectPromptInjection, redactSecrets, sanitizePreferences, INJECTION_REFUSAL } from '../../shared/security/promptGuard.js'
import { validateSchedule, type SectionInput } from './scheduleValidation.service.js'
import { trackEvent } from '../events/event.service.js'

const fail = (res: Response, error: unknown, what: string) => {
  console.error(`[Supervisor] schedules ${what} failed:`, error)
  res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' })
}

const Generate = z.object({
  acdYear: z.coerce.number().int().min(2000).max(2100),
  semesterNo: z.coerce.number().int().min(1).max(3),
  preferences: z.string().max(500).optional(),
})

const Patch = z
  .object({
    sections: z.array(scheduledSectionSchema).max(15),
    reasoning: z.string().max(4000),
    warnings: z.array(z.string().max(500)).max(20),
    status: z.enum(['pending', 'approved']),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' })

const Validate = z.object({
  acdYear: z.coerce.number().int().min(2000).max(2100),
  semesterNo: z.coerce.number().int().min(1).max(3),
  sections: z.array(scheduledSectionSchema).max(15),
  scheduleId: z.string().optional(),
})

const studentNoOf = (req: Request) => {
  const n = Number(req.params.studentNo)
  return Number.isInteger(n) && n > 0 ? n : null
}

/** Resolves the student (must belong to the supervisor) or answers 400/404 and returns null. */
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

function findOwnSchedule(studentNo: number, id: string) {
  if (!mongoose.isValidObjectId(id)) return null
  return AISchedule.findOne({ _id: id, studentNo: String(studentNo) })
}

const totalHours = (sections: { creditHours: number }[]) => sections.reduce((sum, s) => sum + s.creditHours, 0)

class SchedulesController {
  async list(req: Request, res: Response) {
    try {
      const own = await ownStudent(req, res)
      if (!own) return
      const data = await AISchedule.find({ studentNo: String(own.studentNo) })
        .sort({ acdYear: -1, semesterNo: -1, createdAt: -1 })
        .lean()
      res.json({ success: true, data })
    } catch (e) {
      fail(res, e, 'list')
    }
  }

  async get(req: Request, res: Response) {
    try {
      const own = await ownStudent(req, res)
      if (!own) return
      const schedule = await findOwnSchedule(own.studentNo, String(req.params.scheduleId))?.lean()
      if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' })
      res.json({ success: true, data: schedule })
    } catch (e) {
      fail(res, e, 'get')
    }
  }

  /** Generates a schedule for the student and saves it as "pending" (the student is not notified). */
  async generate(req: Request, res: Response) {
    const parsed = Generate.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.flatten() })
    let preferences: string | undefined
    if (parsed.data.preferences) {
      preferences = sanitizePreferences(parsed.data.preferences) || undefined
      if (preferences && detectPromptInjection(preferences).flagged) {
        return res.status(400).json({ success: false, error: INJECTION_REFUSAL })
      }
    }
    try {
      const own = await ownStudent(req, res)
      if (!own) return
      const schedule = await generateSchedule({
        userId: String(own.studentNo),
        acdYear: parsed.data.acdYear,
        semesterNo: parsed.data.semesterNo,
        preferences,
      })
      const saved = await AISchedule.create({ ...schedule, studentNo: String(own.studentNo), status: 'pending' })
      trackEvent('schedule_generated', String(own.studentNo), { source: 'supervisor', sections: schedule.sections.length })
      res.status(201).json({ success: true, data: { ...schedule, _id: saved._id, status: 'pending' } })
    } catch (e) {
      console.error('[Supervisor] schedule generation failed:', e)
      const msg = e instanceof Error ? e.message : 'Unexpected error'
      res.status(500).json({ success: false, error: redactSecrets(msg).slice(0, 300) })
    }
  }

  /** Edits sections / reasoning / warnings, or approves (status: "approved") a schedule. */
  async update(req: Request, res: Response) {
    const parsed = Patch.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.flatten() })
    try {
      const own = await ownStudent(req, res)
      if (!own) return
      const schedule = await findOwnSchedule(own.studentNo, String(req.params.scheduleId))
      if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' })

      const { sections, reasoning, warnings, status } = parsed.data
      // Check the new sections, or (when approving) the saved ones, against the real course sections
      let problems: { errors: unknown[]; warnings: unknown[] } = { errors: [], warnings: [] }
      if (sections || status === 'approved') {
        const toCheck = sections ?? (schedule.sections as unknown as SectionInput[])
        const result = await validateSchedule(schedule.acdYear, schedule.semesterNo, toCheck, schedule.sections)
        problems = result
        if (result.errors.length > 0) {
          return res.status(422).json({
            success: false,
            error: 'Schedule has problems',
            errors: result.errors,
            warnings: result.warnings,
          })
        }
        if (sections) {
          schedule.set('sections', result.sections)
          schedule.totalCreditHours = result.totalCreditHours
        }
      }
      if (reasoning !== undefined) schedule.reasoning = reasoning
      if (warnings) schedule.set('warnings', warnings)
      if (status) {
        schedule.status = status
        if (status === 'approved') {
          // Same rule as the student flow: one schedule per student and semester
          await AISchedule.deleteMany({
            studentNo: schedule.studentNo,
            acdYear: schedule.acdYear,
            semesterNo: schedule.semesterNo,
            _id: { $ne: schedule._id },
          })
        }
      }
      await schedule.save()
      res.json({ success: true, data: schedule, warnings: problems.warnings })
    } catch (e) {
      fail(res, e, 'update')
    }
  }

  /** Dry run for the editor: reports errors and warnings without saving anything. */
  async validate(req: Request, res: Response) {
    const parsed = Validate.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.flatten() })
    try {
      const own = await ownStudent(req, res)
      if (!own) return
      let previous: { courseNo: number; sectionNo: number }[] = []
      if (parsed.data.scheduleId) {
        const saved = await findOwnSchedule(own.studentNo, parsed.data.scheduleId)?.lean()
        previous = saved?.sections ?? []
      }
      const result = await validateSchedule(parsed.data.acdYear, parsed.data.semesterNo, parsed.data.sections, previous)
      res.json({ success: true, data: { valid: result.errors.length === 0, ...result } })
    } catch (e) {
      fail(res, e, 'validate')
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const own = await ownStudent(req, res)
      if (!own) return
      const schedule = await findOwnSchedule(own.studentNo, String(req.params.scheduleId))
      if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' })
      await schedule.deleteOne()
      res.json({ success: true, message: 'Schedule deleted successfully' })
    } catch (e) {
      fail(res, e, 'remove')
    }
  }
}

export const schedulesController = new SchedulesController()
