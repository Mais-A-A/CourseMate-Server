import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../shared/middlewares/auth.middleware.js'
import { User } from './user.model.js'
import { emailMatcher } from '../supervisor/supervisor.service.js'

export const languageRouter = Router()
languageRouter.use(requireAuth())

const Body = z.object({ language: z.enum(['ar', 'en']) })

/**
 * @swagger
 * /user/me/language:
 *   get:
 *     summary: Get the logged-in user's saved language ("ar" or "en")
 *     tags: [Users]
 *   put:
 *     summary: Save the logged-in user's language; used for notifications created in the background
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language: { type: string, enum: [ar, en] }
 */
languageRouter.get('/', async (req, res) => {
  const user: any = await User.findOne({ email: emailMatcher(req.currentUser!.email) }).select('preferredLanguage').lean()
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ language: user.preferredLanguage ?? 'ar' })
})

languageRouter.put('/', async (req, res) => {
  const body = Body.safeParse(req.body)
  if (!body.success) return res.status(400).json({ error: body.error.flatten() })
  const user = await User.findOneAndUpdate(
    { email: emailMatcher(req.currentUser!.email) },
    { preferredLanguage: body.data.language },
  ).select('_id')
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ language: body.data.language })
})
