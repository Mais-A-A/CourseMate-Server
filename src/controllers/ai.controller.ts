import type { Request, Response } from 'express'
import { getAdvisorResponseStream } from '../ai/advisor.service.js'
import { jwtDecode } from 'jwt-decode'
import type { UniversityUser } from '../shared/utils/authUtils.js'
export async function chat(req: Request, res: Response) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null

  let studentId = req.currentUser?.studentId ?? null

  if (!studentId && token) {
    try {
      const decodedToken = jwtDecode<UniversityUser>(token)
      studentId = decodedToken.studentId
    } catch {
      studentId = null
    }
  }

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
