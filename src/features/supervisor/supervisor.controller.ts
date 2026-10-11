import type { Request, Response } from 'express'
import { z } from 'zod'
import {
  listStudents,
  getOverview,
  findStudentForViewer,
  getStudentDetail,
} from './supervisor.service.js'
import { generateInsight } from './insights.service.js'
import { trackEvent } from '../events/event.service.js'

const ListQuery = z.object({
  level: z.enum(['low', 'medium', 'high', 'unknown']).optional(),
  q: z.string().max(60).optional(),
  sort: z.enum(['risk', 'gpa', 'name']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  supervisorEmail: z.string().max(200).optional(),
})
const InsightQuery = z.object({ lang: z.enum(['ar', 'en']).default('ar') })

const fail = (res: Response, error: unknown, what: string) => {
  console.error(`[Supervisor] ${what} failed:`, error)
  res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' })
}

/** Supervisors are always limited to their own students. */
function scopeFor(req: Request) {
  return { supervisorEmail: req.currentUser!.email }
}

function parseStudentNo(req: Request): number | null {
  const n = Number(req.params.studentNo)
  return Number.isInteger(n) && n > 0 ? n : null
}

class SupervisorController {
  async overview(req: Request, res: Response) {
    const query = ListQuery.safeParse(req.query)
    if (!query.success) return res.status(400).json({ success: false, error: query.error.flatten() })
    try {
      const data = await getOverview(scopeFor(req))
      res.json({ success: true, data })
    } catch (error) {
      fail(res, error, 'overview')
    }
  }

  async students(req: Request, res: Response) {
    const query = ListQuery.safeParse(req.query)
    if (!query.success) return res.status(400).json({ success: false, error: query.error.flatten() })
    const { supervisorEmail, ...rest } = query.data
    try {
      const data = await listStudents({ ...scopeFor(req), ...rest })
      res.json({ success: true, data })
    } catch (error) {
      fail(res, error, 'students')
    }
  }

  async student(req: Request, res: Response) {
    const studentNo = parseStudentNo(req)
    if (!studentNo) return res.status(400).json({ success: false, error: 'Invalid student number' })
    try {
      const user = await findStudentForViewer(studentNo, req.currentUser!)
      if (!user) return res.status(404).json({ success: false, error: 'Student not found' })
      const { _risk, _activeWarnings, ...detail } = await getStudentDetail(user)
      res.json({ success: true, data: detail })
    } catch (error) {
      fail(res, error, 'student')
    }
  }

  async insights(req: Request, res: Response) {
    const studentNo = parseStudentNo(req)
    if (!studentNo) return res.status(400).json({ success: false, error: 'Invalid student number' })
    const query = InsightQuery.safeParse(req.query)
    if (!query.success) return res.status(400).json({ success: false, error: query.error.flatten() })
    try {
      const user = await findStudentForViewer(studentNo, req.currentUser!)
      if (!user) return res.status(404).json({ success: false, error: 'Student not found' })
      const detail = await getStudentDetail(user)
      const insight = await generateInsight({
        studentNo,
        risk: detail._risk,
        semesters: detail.semesters,
        warnings: detail._activeWarnings,
        language: query.data.lang,
      })
      trackEvent('risk_insight_generated', String(studentNo), { source: insight.source, level: detail._risk.level })
      res.json({ success: true, data: { risk: detail._risk, insight } })
    } catch (error) {
      fail(res, error, 'insights')
    }
  }
}

export const supervisorController = new SupervisorController()
export default supervisorController
