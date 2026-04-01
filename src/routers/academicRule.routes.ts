import { academicRuleController } from '../controllers/academicRule.controller.js'
import { Router } from 'express'

const academicRuleRouter = Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     AcademicRule:
 *       type: object
 *       required:
 *         - rule_type
 *         - description
 *       properties:
 *         rule_type:
 *           type: string
 *         description:
 *           type: string
 */

/**
 * @swagger
 * /academic-rules:
 *   get:
 *     tags:
 *       - Academic Rules
 *     summary: Get all academic rules
 *     responses:
 *       200:
 *         description: List of all academic rules
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AcademicRule'
 *       500:
 *         description: Internal server error
 */
academicRuleRouter.get('/', academicRuleController.getAcademicRules)

/**
 * @swagger
 * /academic-rules/{id}:
 *   get:
 *     tags:
 *       - Academic Rules
 *     summary: Get an academic rule by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Academic rule found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicRule'
 *       404:
 *         description: Academic rule not found
 *       500:
 *         description: Internal server error
 */
academicRuleRouter.get('/:id', academicRuleController.getAcademicRuleById)

/**
 * @swagger
 * /academic-rules:
 *   post:
 *     tags:
 *       - Academic Rules
 *     summary: Create a new academic rule
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AcademicRule'
 *     responses:
 *       201:
 *         description: Academic rule created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicRule'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
academicRuleRouter.post('/', academicRuleController.createAcademicRule)

/**
 * @swagger
 * /academic-rules/{id}:
 *   put:
 *     tags:
 *       - Academic Rules
 *     summary: Update an academic rule by ID
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
 *             $ref: '#/components/schemas/AcademicRule'
 *     responses:
 *       200:
 *         description: Academic rule updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicRule'
 *       404:
 *         description: Academic rule not found
 *       500:
 *         description: Internal server error
 */
academicRuleRouter.put('/:id', academicRuleController.updateAcademicRule)

/**
 * @swagger
 * /academic-rules/{id}:
 *   delete:
 *     tags:
 *       - Academic Rules
 *     summary: Delete an academic rule by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Academic rule deleted successfully
 *       404:
 *         description: Academic rule not found
 *       500:
 *         description: Internal server error
 */
academicRuleRouter.delete('/:id', academicRuleController.deleteAcademicRule)

export { academicRuleRouter }
export default academicRuleRouter
