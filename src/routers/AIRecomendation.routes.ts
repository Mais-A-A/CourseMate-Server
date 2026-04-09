import { Router } from 'express'
import { aiRecomendationController } from '../controllers/AIRecomendation.controller.js'

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
 * /ai-recommendations:
 *   get:
 *     tags:
 *       - AI Recommendations
 *     summary: Get all AI recommendations
 *     responses:
 *       200:
 *         description: List of all AI recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AIRecomendation'
 */
aiRecomendationRouter.get('/', aiRecomendationController.getAIRecomendations)

/**
 * @swagger
 * /ai-recommendations/{id}:
 *   get:
 *     tags:
 *       - AI Recommendations
 *     summary: Get AI recommendation by ID
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
 *       404:
 *         description: AI recommendation not found
 */
aiRecomendationRouter.get('/:id', aiRecomendationController.getAIRecomendationById)

/**
 * @swagger
 * /ai-recommendations:
 *   post:
 *     tags:
 *       - AI Recommendations
 *     summary: Create AI recommendation
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
 */
aiRecomendationRouter.post('/', aiRecomendationController.createAIRecomendation)

/**
 * @swagger
 * /ai-recommendations/{id}:
 *   put:
 *     tags:
 *       - AI Recommendations
 *     summary: Update AI recommendation by ID
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
 *       404:
 *         description: AI recommendation not found
 */
aiRecomendationRouter.put('/:id', aiRecomendationController.updateAIRecomendation)

/**
 * @swagger
 * /ai-recommendations/{id}:
 *   delete:
 *     tags:
 *       - AI Recommendations
 *     summary: Delete AI recommendation by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: AI recommendation deleted successfully
 *       404:
 *         description: AI recommendation not found
 */
aiRecomendationRouter.delete('/:id', aiRecomendationController.deleteAIRecomendation)

export { aiRecomendationRouter }
export default aiRecomendationRouter