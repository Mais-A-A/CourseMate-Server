import { academicWarningController } from '../controllers/academicWarning.controller.js'
import { Router } from 'express'
import { academicWarningSchema } from '../schemas/academicWarning.schema.js'
import { validateRequest } from '../middlewares/validation.js'
import {
  requireAuth,
  requireRole,
  requireAuthorizeUserOrHigher,
} from '../middlewares/auth.middleware.js'
const academicWarningRouter = Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     AcademicWarning:
 *       type: object
 *       required:
 *         - userId
 *         - warningType
 *         - message
 *       properties:
 *         userId:
 *           type: string
 *         warningType:
 *           type: string
 *         message:
 *           type: string
 *         isResolved:
 *           type: boolean
 *           default: false
 */

/**
 * @swagger
 * /academic-warning:
 *   get:
 *     tags:
 *       - Academic Warnings
 *     summary: Get all academic warnings
 *     responses:
 *       200:
 *         description: List of all academic warnings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AcademicWarning'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
academicWarningRouter.get(
  '/',
  requireAuth,
  requireRole('admin', 'supervisor'),
  academicWarningController.getAcademicWarnings,
)

/**
 * @swagger
 * /academic-warning/warningType/{warningType}:
 *   get:
 *     tags:
 *       - Academic Warnings
 *     summary: Get academic warnings by warning type
 *     parameters:
 *       - in: path
 *         name: warningType
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of academic warnings by type
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AcademicWarning'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
academicWarningRouter.get(
  '/warningType/:warningType',
  requireAuth,
  requireRole('admin', 'supervisor'),
  academicWarningController.getAcademicWarningsByWarningType,
)

/**
 * @swagger
 * /academic-warning/user/{userId}:
 *   get:
 *     tags:
 *       - Academic Warnings
 *     summary: Get academic warnings by user ID
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of academic warnings for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AcademicWarning'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
academicWarningRouter.get(
  '/user/:userId',
  requireAuth,
  requireAuthorizeUserOrHigher,
  academicWarningController.getAcademicWarningsByUserId,
)

/**
 * @swagger
 * /academic-warning/{id}:
 *   get:
 *     tags:
 *       - Academic Warnings
 *     summary: Get an academic warning by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Academic warning found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicWarning'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Academic warning not found
 *       500:
 *         description: Internal server error
 */
academicWarningRouter.get(
  '/:id',
  requireAuth,
  academicWarningController.getAcademicWarningById,
)

/**
 * @swagger
 * /academic-warning:
 *   post:
 *     tags:
 *       - Academic Warnings
 *     summary: Create a new academic warning
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AcademicWarning'
 *     responses:
 *       201:
 *         description: Academic warning created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicWarning'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
academicWarningRouter.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validateRequest(academicWarningSchema),
  academicWarningController.createAcademicWarning,
)

/**
 * @swagger
 * /academic-warning/{id}/resolve:
 *   put:
 *     tags:
 *       - Academic Warnings
 *     summary: Resolve an academic warning
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Academic warning resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicWarning'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Academic warning not found
 *       500:
 *         description: Internal server error
 */
academicWarningRouter.put(
  '/:id/resolve',
  requireAuth,
  requireRole('admin'),
  validateRequest(academicWarningSchema),
  academicWarningController.resolveAcademicWarning,
)

/**
 * @swagger
 * /academic-warning/{id}:
 *   put:
 *     tags:
 *       - Academic Warnings
 *     summary: Update an academic warning by ID
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
 *             $ref: '#/components/schemas/AcademicWarning'
 *     responses:
 *       200:
 *         description: Academic warning updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicWarning'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Academic warning not found
 *       500:
 *         description: Internal server error
 */
academicWarningRouter.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validateRequest(academicWarningSchema),
  academicWarningController.updateAcademicWarning,
)

/**
 * @swagger
 * /academic-warning/{id}:
 *   delete:
 *     tags:
 *       - Academic Warnings
 *     summary: Delete an academic warning by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Academic warning deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Academic warning not found
 *       500:
 *         description: Internal server error
 */
academicWarningRouter.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),

  academicWarningController.deleteAcademicWarning,
)

export { academicWarningRouter }
export default academicWarningRouter
