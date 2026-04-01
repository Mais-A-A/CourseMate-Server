import { academicWarningController } from '../controllers/academicWarning.controller.js'
import { Router } from 'express'

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
 * /academic-warnings:
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
 *       500:
 *         description: Internal server error
 */
academicWarningRouter.get('/', academicWarningController.getAcademicWarnings)

/**
 * @swagger
 * /academic-warnings/warningType/{warningType}:
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
 *       500:
 *         description: Internal server error
 */
academicWarningRouter.get(
  '/warningType/:warningType',
  academicWarningController.getAcademicWarningsByWarningType,
)

/**
 * @swagger
 * /academic-warnings/user/{userId}:
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
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
academicWarningRouter.get(
  '/user/:userId',
  academicWarningController.getAcademicWarningsByUserId,
)

/**
 * @swagger
 * /academic-warnings/{id}:
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
 *       404:
 *         description: Academic warning not found
 *       500:
 *         description: Internal server error
 */
academicWarningRouter.get(
  '/:id',
  academicWarningController.getAcademicWarningById,
)

/**
 * @swagger
 * /academic-warnings:
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
 *       500:
 *         description: Internal server error
 */
academicWarningRouter.post('/', academicWarningController.createAcademicWarning)

/**
 * @swagger
 * /academic-warnings/{id}/resolve:
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
 *       404:
 *         description: Academic warning not found
 *       500:
 *         description: Internal server error
 */
academicWarningRouter.put(
  '/:id/resolve',
  academicWarningController.resolveAcademicWarning,
)

/**
 * @swagger
 * /academic-warnings/{id}:
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
 *       404:
 *         description: Academic warning not found
 *       500:
 *         description: Internal server error
 */
academicWarningRouter.put(
  '/:id',
  academicWarningController.updateAcademicWarning,
)

/**
 * @swagger
 * /academic-warnings/{id}:
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
 *       404:
 *         description: Academic warning not found
 *       500:
 *         description: Internal server error
 */
academicWarningRouter.delete(
  '/:id',
  academicWarningController.deleteAcademicWarning,
)

export { academicWarningRouter }
export default academicWarningRouter
