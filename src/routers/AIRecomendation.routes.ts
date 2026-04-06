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
 */
aiRecomendationRouter.get('/', aiRecomendationController.getAIRecomendations)

/**
 * @swagger
 * /ai-recommendations/{id}:
 *   get:
 *     tags:
 *       - AI Recommendations
 *     summary: Get AI recommendation by ID
 */
aiRecomendationRouter.get('/:id', aiRecomendationController.getAIRecomendationById)

/**
 * @swagger
 * /ai-recommendations:
 *   post:
 *     tags:
 *       - AI Recommendations
 *     summary: Create AI recommendation
 */
aiRecomendationRouter.post('/', aiRecomendationController.createAIRecomendation)

/**
 * @swagger
 * /ai-recommendations/{id}:
 *   put:
 *     tags:
 *       - AI Recommendations
 *     summary: Update AI recommendation
 */
aiRecomendationRouter.put('/:id', aiRecomendationController.updateAIRecomendation)

/**
 * @swagger
 * /ai-recommendations/{id}:
 *   delete:
 *     tags:
 *       - AI Recommendations
 *     summary: Delete AI recommendation
 */
aiRecomendationRouter.delete('/:id', aiRecomendationController.deleteAIRecomendation)

export { aiRecomendationRouter }
export default aiRecomendationRouter