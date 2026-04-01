import { Router, type Request, type Response } from 'express'
import passport from 'passport'
import { generateJWT, verifyJWT } from '../shared/utils/authUtils.js'
import { type UniversityUser } from '../shared/utils/authUtils.js'
import envVars from '../../env.js'
const authRouter = Router()

authRouter.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  }) as any,
)

authRouter.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${envVars.CLIENT_URL}/login?error=unauthorized`,
    session: false,
  }) as any,
  (req: Request, res: Response) => {
    const user = req.user as UniversityUser
    const token = generateJWT(user)
    res
      .cookie('token', token, {
        httpOnly: true,
        secure: envVars.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .redirect(`${envVars.CLIENT_URL}/dashboard`)
  },
)

authRouter.post('/logout', (req: Request, res: Response) => {
  res
    .clearCookie('token', {
      httpOnly: true,
      secure: envVars.NODE_ENV === 'production',
      sameSite: 'lax',
    })
    .json({ message: 'Logged out successfully' })
})

authRouter.get('/me', (req: Request, res: Response) => {
  const token = req.cookies.token
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  const user = verifyJWT(token)
  if (!user) {
    res.clearCookie('token')
    return res
      .status(401)
      .json({ message: 'Session expired, please log in again' })
  }
  res.json({ user })
})

export default authRouter
