import { academicPlanController } from '../controllers/academicPlan.controller.js'
import { Router } from 'express'

const academicPlanRouter = Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     AcademicPlan:
 *       type: object
 *       required:
 *         - plan_name
 *         - total_credits_required
 *         - required_courses
 *       properties:
 *         plan_name:
 *           type: string
 *         total_credits_required:
 *           type: number
 *         required_courses:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /academic-plans:
 *   get:
 *     tags:
 *       - Academic Plans
 *     summary: Get all academic plans
 *     responses:
 *       200:
 *         description: List of all academic plans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AcademicPlan'
 *       500:
 *         description: Internal server error
 */
academicPlanRouter.get('/', academicPlanController.getAcademicPlans)

/**
 * @swagger
 * /academic-plans/{id}:
 *   get:
 *     tags:
 *       - Academic Plans
 *     summary: Get an academic plan by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Academic plan found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicPlan'
 *       404:
 *         description: Academic plan not found
 *       500:
 *         description: Internal server error
 */
academicPlanRouter.get('/:id', academicPlanController.getAcademicPlanById)

/**
 * @swagger
 * /academic-plans:
 *   post:
 *     tags:
 *       - Academic Plans
 *     summary: Create a new academic plan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AcademicPlan'
 *     responses:
 *       201:
 *         description: Academic plan created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicPlan'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
academicPlanRouter.post('/', academicPlanController.createAcademicPlan)

/**
 * @swagger
 * /academic-plans/{id}:
 *   put:
 *     tags:
 *       - Academic Plans
 *     summary: Update an academic plan by ID
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
 *             $ref: '#/components/schemas/AcademicPlan'
 *     responses:
 *       200:
 *         description: Academic plan updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicPlan'
 *       404:
 *         description: Academic plan not found
 *       500:
 *         description: Internal server error
 */
academicPlanRouter.put('/:id', academicPlanController.updateAcademicPlan)

/**
 * @swagger
 * /academic-plans/{id}:
 *   delete:
 *     tags:
 *       - Academic Plans
 *     summary: Delete an academic plan by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Academic plan deleted successfully
 *       404:
 *         description: Academic plan not found
 *       500:
 *         description: Internal server error
 */
academicPlanRouter.delete('/:id', academicPlanController.deleteAcademicPlan)

export { academicPlanRouter }
export default academicPlanRouter
