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
 *             properties:
 *               prompt:
 *                 type: string
 *             required:
 *               - prompt
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
