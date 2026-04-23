import { Router } from 'express'
import { chat } from '../controllers/ai.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { ChatSchema } from '../schemas/ai.schema.js'
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

export default router
