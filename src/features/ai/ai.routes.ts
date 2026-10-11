import { Router } from 'express'
import {
  chat,
  generateScheduleHandler,
  generateScheduleForStudentHandler,
  approveScheduleHandler,
  getApprovedScheduleHandler,
  getScheduleHistoryHandler,
  getStudentScheduleHandler,
  listSessionsHandler,
  getSessionHandler,
  renameSessionHandler,
  deleteSessionHandler,
} from './ai.controller.js'
import { requireAuth } from '../../shared/middlewares/auth.middleware.js'
import {
  ChatSchema,
  GenerateScheduleSchema,
  GenerateScheduleForStudentSchema,
  RenameSessionSchema,
} from './ai.schema.js'
import {
  chatBurstLimiter,
  chatDailyLimiter,
  scheduleLimiter,
} from '../../shared/middlewares/rateLimit.js'
import { validateRequest } from '../../shared/middlewares/validation.js'

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
 *       429:
 *         description: "Rate limited. Body: { error, retryAfter (seconds) }. Limits: 10 messages/min and 150/day per user."
 */
router.post(
  '/chat',
  validateRequest(ChatSchema),
  requireAuth(),
  chatBurstLimiter,
  chatDailyLimiter,
  chat,
)

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
  scheduleLimiter,
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
  scheduleLimiter,
  generateScheduleForStudentHandler,
)
/**
 * @swagger
 * /ai/schedule/approve:
 *   post:
 *     tags:
 *       - AI
 *     summary: Approve the student's latest pending AI-generated schedule
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Schedule approved and saved
 *       404:
 *         description: No pending schedule found
 *       401:
 *         description: Unauthorized
 */
router.post('/schedule/approve', requireAuth(), approveScheduleHandler)

/**
 * @swagger
 * /ai/schedule/approved:
 *   get:
 *     tags:
 *       - AI
 *     summary: Get the student's last approved AI-generated schedule
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: acdYear
 *         schema:
 *           type: number
 *       - in: query
 *         name: semesterNo
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Approved schedule found
 *       404:
 *         description: No approved schedule found
 *       401:
 *         description: Unauthorized
 */
router.get('/schedule/approved', requireAuth(), getApprovedScheduleHandler)
/**
 * @swagger
 * /ai/schedule/history:
 *   get:
 *     tags:
 *       - AI
 *     summary: Get all AI-generated schedule suggestions for the current student (pending + approved)
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of schedule suggestions sorted by newest first
 *       401:
 *         description: Unauthorized
 */
router.get('/schedule/history', requireAuth(), getScheduleHistoryHandler)
router.get('/schedule/student/:studentNo', requireAuth(), getStudentScheduleHandler)

/**
 * @swagger
 * /ai/sessions:
 *   get:
 *     tags: [AI]
 *     summary: List the current student's saved chat sessions (newest first)
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: "data[]: { sessionId, title, lastMessageAt, createdAt, messageCount, lastMessage }"
 */
router.get('/sessions', requireAuth(), listSessionsHandler)

/**
 * @swagger
 * /ai/sessions/{sessionId}:
 *   get:
 *     tags: [AI]
 *     summary: Get a saved chat session with all its messages
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: sessionId, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: "data: { sessionId, title, messages: [{role, content, createdAt}], pendingSchedule }"
 *       404:
 *         description: Session not found
 *   patch:
 *     tags: [AI]
 *     summary: Rename a chat session
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: sessionId, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string, maxLength: 100 }
 *     responses:
 *       200:
 *         description: Renamed
 *   delete:
 *     tags: [AI]
 *     summary: Delete a chat session
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: sessionId, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Session not found
 */
router.get('/sessions/:sessionId', requireAuth(), getSessionHandler)
router.patch(
  '/sessions/:sessionId',
  validateRequest(RenameSessionSchema),
  requireAuth(),
  renameSessionHandler,
)
router.delete('/sessions/:sessionId', requireAuth(), deleteSessionHandler)

export default router
