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
    const userEmail = req.query.email as string
    console.log('Checking authorization for user with email:', userEmail)
    const user = (await verifyJWT(
      req.cookies.token || req.headers.authorization?.split(' ')[1],
    )) as JwtPayload
    if (!user) {
      return res
        .status(401)
        .json({ message: 'You must be logged in to access this resource' })
    }
    console.log('Authenticated user:', user.email.concat('.ps'))
    if (
      user.role !== 'admin' &&
      user.role !== 'supervisor' &&
      user.email != userEmail.concat('.ps')
    ) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to access this resource' })
    }
    next()
  }
}
