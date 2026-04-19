import { Router, type Request, type Response } from 'express'
import passport from 'passport'
import { generateJWT, verifyJWT } from '../shared/utils/authUtils.js'
import { type UniversityUser } from '../shared/utils/authUtils.js'
import envVars from '../../env.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
const authRouter = Router()

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Start Google OAuth login flow
 *     responses:
 *       302:
 *         description: Redirects to Google authentication page
 */
authRouter.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  }) as any,
)

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Google OAuth callback endpoint
 *     responses:
 *       302:
 *         description: Redirects to client app and sets authentication cookie on success
 */
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

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Log out current user
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
authRouter.post('/logout', requireAuth, (req: Request, res: Response) => {
  res
    .clearCookie('token', {
      httpOnly: true,
      secure: envVars.NODE_ENV === 'production',
      sameSite: 'lax',
    })
    .json({ message: 'Logged out successfully' })
})

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get authenticated user from JWT cookie
 *     responses:
 *       200:
 *         description: Authenticated user payload
 *       401:
 *         description: Unauthorized or expired session
 */
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
