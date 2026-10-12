import { Router } from 'express'
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware.js'
import { meetingsController } from './meetings.controller.js'

export const studentMeetingsRouter = Router()

/**
 * @swagger
 * /meetings/mine:
 *   get:
 *     summary: The logged-in student's advising meetings (no private supervisor notes)
 *     tags: [Meetings]
 */
studentMeetingsRouter.get('/mine', requireAuth(), requireRole('student'), meetingsController.mine)
