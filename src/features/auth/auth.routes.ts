import { Router, type Request, type Response } from 'express'
import passport from 'passport'
import { generateJWT, verifyJWT } from '../../shared/utils/authUtils.js'
import { type UniversityUser } from '../../shared/utils/authUtils.js'
import envVars from '../../../env.js'
import { randomBytes } from 'node:crypto'
import { AuthCode } from './authCode.model.js'
import { authExchangeLimiter } from '../../shared/middlewares/rateLimit.js'
import { requireAuth } from '../../shared/middlewares/auth.middleware.js'
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
  async (req: Request, res: Response) => {
    const user = req.user as UniversityUser
    const token = generateJWT(user)
    // The JWT never appears in a URL: the frontend swaps this one-time code for it via POST /api/auth/exchange.
    const code = randomBytes(32).toString('hex')
    await AuthCode.create({ code, token })

    res
      .cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .redirect(`${envVars.CLIENT_URL}/dashboard#code=${code}`)
  },
)

/**
 * @swagger
 * /api/auth/exchange:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange the one-time code from the login redirect for a JWT
 *     description: The Google callback redirects to `{CLIENT_URL}/dashboard#code=<code>`. The code is single-use and expires after 60 seconds.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string }
 *     responses:
 *       200:
 *         description: "{ token, user } - send the token as `Authorization: Bearer <token>`"
 *       400:
 *         description: Invalid or expired code
 */
authRouter.post('/exchange', authExchangeLimiter, async (req: Request, res: Response) => {
  const code = req.body?.code
  if (typeof code !== 'string' || !/^[a-f0-9]{64}$/.test(code)) {
    return res.status(400).json({ message: 'Invalid or expired code' })
  }
  // Atomic find-and-delete makes the code single-use even under concurrent requests.
  const entry = await AuthCode.findOneAndDelete({ code }).lean()
  const user = entry ? await verifyJWT(entry.token) : null
  if (!entry || !user) {
    return res.status(400).json({ message: 'Invalid or expired code' })
  }
  res.json({ token: entry.token, user })
})

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
authRouter.post('/logout', requireAuth(), (req: Request, res: Response) => {
  res
    .clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
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
authRouter.get('/me', async (req: Request, res: Response) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  const user = await verifyJWT(token)
  if (!user) {
    res.clearCookie('token')
    return res
      .status(401)
      .json({ message: 'Session expired, please log in again' })
  }
  res.json({ user })
})

export default authRouter
