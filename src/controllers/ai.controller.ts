import type { Request, Response } from 'express'
import { getAdvisorResponse } from '../ai/advisor.service.js'
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

  const { message, sessionId } = req.body

  const response = await getAdvisorResponse(sessionId, studentId, message)
  res.json({ response })
}
