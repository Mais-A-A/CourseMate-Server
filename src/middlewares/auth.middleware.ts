import type { Request, Response, NextFunction } from 'express'
import type { UserRole } from '../shared/types/types.js'
import { verifyJWT } from '../shared/utils/authUtils.js'
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
    console.log('Checking authentication for request to', req.path)
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

export function requireAuthorizeUserOrHigher() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const emailFromQuery = req.query.email as string | undefined
    const student_id =
      (req.params.student_id as string) ||
      ((emailFromQuery && emailFromQuery.includes('@')
        ? emailFromQuery.split('@')[0]
        : undefined) as string)
    const user = (await verifyJWT(
      req.cookies.token || req.headers.authorization?.split(' ')[1],
    )) as JwtPayload
    if (!user) {
      return res
        .status(401)
        .json({ message: 'You must be logged in to access this resource' })
    }
    if (
      user.role !== 'admin' &&
      user.role !== 'supervisor' &&
      user.studentId !== student_id
    ) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to access this resource' })
    }
    next()
  }
}
