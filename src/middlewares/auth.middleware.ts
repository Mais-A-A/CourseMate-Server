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
export function requireAuth(requiredRole?: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    try {
      const decoded = verifyJWT(token) as JwtPayload
      if (!decoded) {
        res.clearCookie('token')
        return res
          .status(401)
          .json({ message: 'Session expired, please log in again' })
      }
      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ message: 'Forbidden' })
      }
      req.currentUser = decoded
      next()
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
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.currentUser) {
      return res
        .status(401)
        .json({ message: 'You must be logged in to access this resource' })
    }
    if (!roles.includes(req.currentUser.role)) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to access this resource' })
    }
    next()
  }
}
