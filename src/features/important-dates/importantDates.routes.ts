import { Router } from 'express'
import { importantDatesController } from './importantDates.controller.js'
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware.js'
import { validateRequest } from '../../shared/middlewares/validation.js'
import { importantDatesSchema } from './importantDates.schema.js'

const importantDatesRouter = Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     ImportantDate:
 *       type: object
 *       required:
 *         - date_name
 *         - date
 *         - type
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the important date
 *         date_name:
 *           type: string
 *           description: Name of the important date
 *         date:
 *           type: string
 *           format: date-time
 *           description: The date and time
 *         description:
 *           type: string
 *           description: Description of the important date
 *         type:
 *           type: string
 *           enum: [holiday, registration, deadline, event]
 *           description: Type of the important date
 *         issued_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /important-dates:
 *   get:
 *     tags:
 *       - Important Dates
 *     summary: Get all important dates
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all important dates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ImportantDate'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
importantDatesRouter.get(
  '/',
  requireAuth(),
  importantDatesController.getAllImportantDates,
)

/**
 * @swagger
 * /important-dates/upcoming:
 *   get:
 *     tags:
 *       - Important Dates
 *     summary: Get upcoming important dates
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of upcoming important dates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ImportantDate'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
importantDatesRouter.get(
  '/upcoming',
  requireAuth(),
  importantDatesController.getUpcomingImportantDates,
)

/**
 * @swagger
 * /important-dates/type/{type}:
 *   get:
 *     tags:
 *       - Important Dates
 *     summary: Get important dates by type
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [holiday, registration, deadline, event]
 *         description: The type of important date
 *     responses:
 *       200:
 *         description: List of important dates filtered by type
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ImportantDate'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
importantDatesRouter.get(
  '/type/:type',
  requireAuth(),
  importantDatesController.getImportantDatesByType,
)

/**
 * @swagger
 * /important-dates/{id}:
 *   get:
 *     tags:
 *       - Important Dates
 *     summary: Get important date by ID
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the important date
 *     responses:
 *       200:
 *         description: Important date found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImportantDate'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Important date not found
 *       500:
 *         description: Internal server error
 */
importantDatesRouter.get(
  '/:id',
  requireAuth(),
  importantDatesController.getImportantDateById,
)

/**
 * @swagger
 * /important-dates:
 *   post:
 *     tags:
 *       - Important Dates
 *     summary: Create a new important date
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
 *               - date_name
 *               - date
 *               - type
 *             properties:
 *               date_name:
 *                 type: string
 *                 example: "Spring Break"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-03-15T00:00:00Z"
 *               description:
 *                 type: string
 *                 example: "Weekly break for students"
 *               type:
 *                 type: string
 *                 enum: [holiday, registration, deadline, event]
 *                 example: "holiday"
 *     responses:
 *       201:
 *         description: Important date created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImportantDate'
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
importantDatesRouter.post(
  '/',
  requireAuth(),
  requireRole('admin'),
  validateRequest(importantDatesSchema),
  importantDatesController.createImportantDate,
)

/**
 * @swagger
 * /important-dates/{id}:
 *   put:
 *     tags:
 *       - Important Dates
 *     summary: Update an important date
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the important date to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date_name:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [holiday, registration, deadline, event]
 *     responses:
 *       200:
 *         description: Important date updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImportantDate'
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Important date not found
 *       500:
 *         description: Internal server error
 */
importantDatesRouter.put(
  '/:id',
  requireAuth(),
  requireRole('admin'),
  validateRequest(importantDatesSchema),
  importantDatesController.updateImportantDate,
)

/**
 * @swagger
 * /important-dates/{id}:
 *   delete:
 *     tags:
 *       - Important Dates
 *     summary: Delete an important date by ID
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the important date to delete
 *     responses:
 *       204:
 *         description: Important date deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Important date not found
 *       500:
 *         description: Internal server error
 */
importantDatesRouter.delete(
  '/:id',
  requireAuth(),
  requireRole('admin'),
  importantDatesController.deleteImportantDate,
)

/**
 * @swagger
 * /important-dates:
 *   delete:
 *     tags:
 *       - Important Dates
 *     summary: Delete all important dates
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: All important dates deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
importantDatesRouter.delete(
  '/',
  requireAuth(),
  requireRole('admin'),
  importantDatesController.deleteAllImportantDates,
)

export { importantDatesRouter }
export default importantDatesRouter
