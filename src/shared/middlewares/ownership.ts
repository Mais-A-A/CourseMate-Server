import { User } from '../../features/user/user.model.js'
import { Notification } from '../../features/notification/notification.model.js'
import { Schedule } from '../../features/schedule/schedule.model.js'
import { AcademicWarning } from '../../features/academic-warning/academicWarning.model.js'
import type { Request } from 'express'

// Resolvers for requireSelfOrStaff(): they return the email of the user who owns the requested record.
// An unknown or malformed id resolves to null/throws, which the middleware answers with 403.

async function emailOfUser(userId: unknown): Promise<string | null> {
  if (!userId) return null
  const user = await User.findById(String(userId)).select('email').lean()
  return user?.email ?? null
}

export const ownerOfUserParam = (param: string) => (req: Request) =>
  emailOfUser(req.params[param])

export const ownerOfNotification = async (req: Request) => {
  const n = await Notification.findById(String(req.params.notificationId)).select('userId').lean()
  return emailOfUser(n?.userId)
}

export const ownerOfSchedule = async (req: Request) => {
  const s = await Schedule.findById(String(req.params.id)).select('student_id').lean()
  return emailOfUser(s?.student_id)
}

export const ownerOfWarning = async (req: Request) => {
  const w = await AcademicWarning.findById(String(req.params.id)).select('user_id').lean()
  return emailOfUser(w?.user_id)
}
