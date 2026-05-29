import type { Request, Response } from 'express'
import { getAdvisorResponseStream } from '../ai/advisor.service.js'
import { generateSchedule } from '../ai/schedule.generator.js'
import { verifyJWT } from '../shared/utils/authUtils.js'
import { AISchedule } from '../models/aiSchedule.model.js'

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

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const { message, sessionId } = req.body

  try {
    const stream = await getAdvisorResponseStream(sessionId, studentId, message)
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`)
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unexpected error'
    if (!res.headersSent) {
      res.status(500).json({ error: msg })
      return
    }
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`)
  } finally {
    res.end()
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

    res.status(200).json({ success: true, data: { _id: target._id, acdYear: target.acdYear, semesterNo: target.semesterNo } })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unexpected error'
    res.status(500).json({ success: false, error: msg })
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
    const msg = error instanceof Error ? error.message : 'Unexpected error'
    res.status(500).json({ success: false, error: msg })
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
    const msg = error instanceof Error ? error.message : 'Unexpected error'
    res.status(500).json({ success: false, error: msg })
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

  const { acdYear, semesterNo, preferences } = req.body

  if (!acdYear || !semesterNo) {
    res.status(400).json({ error: 'acdYear and semesterNo are required' })
    return
  }

  const parsedYear = Number(acdYear)
  const parsedSemester = Number(semesterNo)

  if (isNaN(parsedYear) || isNaN(parsedSemester)) {
    res.status(400).json({ error: 'acdYear and semesterNo must be numbers' })
    return
  }

  try {
    const schedule = await generateSchedule({
      userId: studentId,
      acdYear: parsedYear,
      semesterNo: parsedSemester,
      preferences: typeof preferences === 'string' ? preferences : undefined,
    })

    const saved = await AISchedule.create({ ...schedule, studentNo: studentId, status: 'pending' })

    res.status(200).json({ success: true, data: { ...schedule, _id: saved._id } })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unexpected error'
    res.status(500).json({ success: false, error: msg })
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

  const { studentId, acdYear, semesterNo, preferences } = req.body

  const parsedYear = Number(acdYear)
  const parsedSemester = Number(semesterNo)

  if (!studentId || isNaN(parsedYear) || isNaN(parsedSemester)) {
    res.status(400).json({ error: 'studentId, acdYear and semesterNo are required' })
    return
  }

  try {
    const schedule = await generateSchedule({
      userId: studentId,
      acdYear: parsedYear,
      semesterNo: parsedSemester,
      preferences: typeof preferences === 'string' ? preferences : undefined,
    })

    res.status(200).json({ success: true, data: schedule })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unexpected error'
    res.status(500).json({ success: false, error: msg })
  }
}
