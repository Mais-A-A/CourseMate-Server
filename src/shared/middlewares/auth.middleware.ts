import type { Request, Response, NextFunction } from 'express'
import type { UserRole } from '../types/types.js'
import { verifyJWT } from '../utils/authUtils.js'
import { User } from '../../features/user/user.model.js'
interface JwtPayload {
  email: string
  name: string
  avatar: string
  role: UserRole
  studentId: string | null
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: JwtPayload
    }
  }
}
export function requireAuth() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    try {
      const decoded = (await verifyJWT(token)) as JwtPayload
      if (!decoded) {
        res.clearCookie('token')
        return res
          .status(401)
          .json({ message: 'Session expired, please log in again' })
      }
      req.currentUser = decoded
      return next()
    } catch (err) {
      console.error('JWT verification failed:', err)
      res.clearCookie('token')
      return res
        .status(401)
        .json({ message: 'Session expired, please log in again' })
    }
  }
}

export function requireRole(...roles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (await verifyJWT(
      req.cookies.token || req.headers.authorization?.split(' ')[1],
    )) as JwtPayload
    if (!user) {
      return res
        .status(401)
        .json({ message: 'You must be logged in to access this resource' })
    }
    if (!roles.includes(user.role)) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to access this resource' })
    }
    next()
  }
}

// "221141@ppu.edu" and "221141@ppu.edu.ps" are the same person: compare only the part before "@".
const emailLocalPart = (email: string) => email.trim().toLowerCase().split('@')[0]!

const emailPattern = (email: string) =>
  new RegExp(`^${emailLocalPart(email).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}@ppu\\.edu(\\.ps)?$`, 'i')

/** True when `studentEmail` belongs to a student whose assigned supervisor is `supervisorEmail`. */
async function isStudentOfSupervisor(studentEmail: string, supervisorEmail: string) {
  return !!(await User.exists({
    email: emailPattern(studentEmail),
    role: 'student',
    'student_data.supervisor.supervisorEmail': emailPattern(supervisorEmail),
  }))
}

/**
 * Allows the logged-in user when the target email (resolved from the request) is their own, or a
 * supervisor when the target is one of THEIR students. Admins get no access to individual students'
 * private data here (they manage system data through the admin-only routes).
 * `getTargetEmail` returns null when the target doesn't exist.
 */
export function requireSelfOrStaff(
  getTargetEmail: (req: Request) => Promise<string | null | undefined> | string | null | undefined,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (await verifyJWT(
      req.cookies.token || req.headers.authorization?.split(' ')[1],
    )) as JwtPayload
    if (!user) {
      return res
        .status(401)
        .json({ message: 'You must be logged in to access this resource' })
    }

    let targetEmail: string | null | undefined
    try {
      targetEmail = await getTargetEmail(req)
    } catch {
      targetEmail = null
    }
    const allowed =
      !!targetEmail &&
      (emailLocalPart(user.email) === emailLocalPart(targetEmail) ||
        (user.role === 'supervisor' && (await isStudentOfSupervisor(targetEmail, user.email))))
    if (!allowed) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to access this resource' })
    }
    next()
  }
}

/** Supervisors may only query their own students (`?supervisorEmail=` must be their email). */
export function requireOwnSupervisorQuery() {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.currentUser
    const wanted = req.query.supervisorEmail
    if (
      user?.role === 'supervisor' &&
      (typeof wanted !== 'string' || emailLocalPart(wanted) !== emailLocalPart(user.email))
    ) {
      return res.status(403).json({ message: 'You can only view your own students' })
    }
    next()
  }
}

/** For routes with an `?email=` query: staff, or the user whose email it is. */
export function requireAuthorizeUserOrHigher() {
  return requireSelfOrStaff((req) =>
    typeof req.query.email === 'string' ? req.query.email : null,
  )
}
