import { academicRuleController } from './academicRule.controller.js'
import { Router } from 'express'
import { academicRuleSchema } from './academicRule.schema.js'
import { validateRequest } from '../../shared/middlewares/validation.js'
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware.js'
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
 * /academic-rule:
 *   get:
 *     tags:
 *       - Academic Rules
 *     summary: Get all academic rules
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all academic rules
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AcademicRule'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
academicRuleRouter.get(
  '/',
  requireAuth(),
  academicRuleController.getAcademicRules,
)

/**
 * @swagger
 * /academic-rule/{id}:
 *   get:
 *     tags:
 *       - Academic Rules
 *     summary: Get an academic rule by ID
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
 *         description: Academic rule found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicRule'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Academic rule not found
 *       500:
 *         description: Internal server error
 */
academicRuleRouter.get(
  '/:id',
  requireAuth(),
  academicRuleController.getAcademicRuleById,
)

/**
 * @swagger
 * /academic-rule:
 *   post:
 *     tags:
 *       - Academic Rules
 *     summary: Create a new academic rule
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
academicRuleRouter.post(
  '/',
  requireAuth(),
  requireRole('admin'),
  validateRequest(academicRuleSchema),
  academicRuleController.createAcademicRule,
)

/**
 * @swagger
 * /academic-rule/{id}:
 *   put:
 *     tags:
 *       - Academic Rules
 *     summary: Update an academic rule by ID
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
 *             $ref: '#/components/schemas/AcademicRule'
 *     responses:
 *       200:
 *         description: Academic rule updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicRule'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Academic rule not found
 *       500:
 *         description: Internal server error
 */
academicRuleRouter.put(
  '/:id',
  requireAuth(),
  requireRole('admin'),
  validateRequest(academicRuleSchema),
  academicRuleController.updateAcademicRule,
)

/**
 * @swagger
 * /academic-rule/{id}:
 *   delete:
 *     tags:
 *       - Academic Rules
 *     summary: Delete an academic rule by ID
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
 *         description: Academic rule deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Academic rule not found
 *       500:
 *         description: Internal server error
 */
academicRuleRouter.delete(
  '/:id',
  requireAuth(),
  requireRole('admin'),
  academicRuleController.deleteAcademicRule,
)

export { academicRuleRouter }
export default academicRuleRouter
