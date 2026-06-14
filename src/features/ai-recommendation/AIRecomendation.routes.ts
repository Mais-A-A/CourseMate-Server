import { Router } from 'express'
import { aiRecomendationController } from './AIRecomendation.controller.js'
import { AIRecomendationSchema } from './AIRecomendation.schema.js'
import { validateRequest } from '../../shared/middlewares/validation.js'
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware.js'

const aiRecomendationRouter = Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     AIRecomendation:
 *       type: object
 *       required:
 *         - courses
 *       properties:
 *         student_id:
 *           type: string
 *         supervisor_id:
 *           type: string
 *         courses:
 *           type: array
 *           items:
 *             type: string
 *         reason:
 *           type: string
 *         confidenceScore:
 *           type: number
 */

/**
 * @swagger
 * /ai-recomendation:
 *   get:
 *     tags:
 *       - AI Recommendations
 *     summary: Get all AI recommendations
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all AI recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AIRecomendation'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
aiRecomendationRouter.get(
  '/',
  requireAuth(),
  requireRole('admin', 'supervisor'),
  aiRecomendationController.getAIRecomendations,
)

/**
 * @swagger
 * /ai-recomendation/{id}:
 *   get:
 *     tags:
 *       - AI Recommendations
 *     summary: Get AI recommendation by ID
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: AI recommendation found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIRecomendation'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: AI recommendation not found
 */
aiRecomendationRouter.get(
  '/:id',
  requireAuth(),
  requireRole('admin', 'supervisor'),
  aiRecomendationController.getAIRecomendationById,
)

/**
 * @swagger
 * /ai-recomendation:
 *   post:
 *     tags:
 *       - AI Recommendations
 *     summary: Create AI recommendation
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AIRecomendation'
 *     responses:
 *       201:
 *         description: AI recommendation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIRecomendation'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
aiRecomendationRouter.post(
  '/',
  requireAuth(),
  validateRequest(AIRecomendationSchema),
  aiRecomendationController.createAIRecomendation,
)

/**
 * @swagger
 * /ai-recomendation/{id}:
 *   put:
 *     tags:
 *       - AI Recommendations
 *     summary: Update AI recommendation by ID
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AIRecomendation'
 *     responses:
 *       200:
 *         description: AI recommendation updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIRecomendation'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: AI recommendation not found
 */
aiRecomendationRouter.put(
  '/:id',
  requireAuth(),
  validateRequest(AIRecomendationSchema),
  requireRole('admin'),
  aiRecomendationController.updateAIRecomendation,
)

/**
 * @swagger
 * /ai-recomendation/{id}:
 *   delete:
 *     tags:
 *       - AI Recommendations
 *     summary: Delete AI recommendation by ID
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: AI recommendation deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: AI recommendation not found
 */
aiRecomendationRouter.delete(
  '/:id',
  requireAuth(),
  requireRole('admin'),
  aiRecomendationController.deleteAIRecomendation,
)

export { aiRecomendationRouter }
export default aiRecomendationRouter
