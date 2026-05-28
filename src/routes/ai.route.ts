import { Router } from 'express'
import { chat, generateScheduleHandler, generateScheduleForStudentHandler } from '../controllers/ai.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { ChatSchema, GenerateScheduleSchema, GenerateScheduleForStudentSchema } from '../schemas/ai.schema.js'
import { validateRequest } from '../middlewares/validation.js'

const router = Router()

/**
 * @swagger
 * /ai/chat:
 *   post:
 *     tags:
 *       - AI
 *     summary: Chat with the AI advisor
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - sessionId
 *             properties:
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *               sessionId:
 *                 type: string
 *                 minLength: 1
 *     responses:
 *       200:
 *         description: AI response generated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/chat', validateRequest(ChatSchema), requireAuth(), chat)

/**
 * @swagger
 * /ai/schedule/generate:
 *   post:
 *     tags:
 *       - AI
 *     summary: Generate a personalized semester schedule using AI
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - acdYear
 *               - semesterNo
 *             properties:
 *               acdYear:
 *                 type: number
 *               semesterNo:
 *                 type: number
 *               preferences:
 *                 type: string
 *                 description: Free text preferences (e.g. morning classes, max 15 hours)
 *     responses:
 *       200:
 *         description: Schedule generated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: AI generation error
 */
router.post(
  '/schedule/generate',
  validateRequest(GenerateScheduleSchema),
  requireAuth(),
  generateScheduleHandler,
)

/**
 * @swagger
 * /ai/schedule/generate/student:
 *   post:
 *     tags:
 *       - AI
 *     summary: Generate a personalized semester schedule for a specific student (supervisor use)
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - acdYear
 *               - semesterNo
 *             properties:
 *               studentId:
 *                 type: string
 *                 description: The student's university ID
 *               acdYear:
 *                 type: number
 *                 description: Academic year (e.g. 2025)
 *               semesterNo:
 *                 type: number
 *                 description: Semester number (e.g. 1 or 2)
 *               preferences:
 *                 type: string
 *                 description: Free text preferences (e.g. morning classes, max 15 hours)
 *     responses:
 *       200:
 *         description: Schedule generated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: AI generation error
 */
router.post(
  '/schedule/generate/student',
  validateRequest(GenerateScheduleForStudentSchema),
  requireAuth(),
  generateScheduleForStudentHandler,
)
export default router