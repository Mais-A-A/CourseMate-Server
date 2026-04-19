import { Router } from 'express'
import { scheduleController } from '../controllers/schedule.controller.js'
import { ScheduleSchema } from '../schemas/schedule.schema.js'
import { validateRequest } from '../middlewares/validation.js'
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js'
const scheduleRouter = Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     Schedule:
 *       type: object
 *       required:
 *         - student_id
 *         - semester_id
 *       properties:
 *         student_id:
 *           type: string
 *         semester_id:
 *           type: string
 *         course_sections:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               course_section_id:
 *                 type: array
 *                 items:
 *                   type: string
 */

/**
 * @swagger
 * /schedule:
 *   get:
 *     tags:
 *       - Schedules
 *     summary: Get all schedules
 *     responses:
 *       200:
 *         description: List of all schedules
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Schedule'
 *       401:
 *         description: Unauthorized
 */
scheduleRouter.get('/', requireAuth, scheduleController.getSchedules)

/**
 * @swagger
 * /schedule/{id}:
 *   get:
 *     tags:
 *       - Schedules
 *     summary: Get a schedule by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Schedule found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Schedule'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Schedule not found
 */
scheduleRouter.get('/:id', requireAuth, scheduleController.getScheduleById)

/**
 * @swagger
 * /schedule:
 *   post:
 *     tags:
 *       - Schedules
 *     summary: Create a new schedule
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Schedule'
 *     responses:
 *       201:
 *         description: Schedule created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Schedule'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
scheduleRouter.post(
  '/',
  requireAuth,
  validateRequest(ScheduleSchema),
  scheduleController.createSchedule,
)

/**
 * @swagger
 * /schedule/{id}:
 *   put:
 *     tags:
 *       - Schedules
 *     summary: Update a schedule by ID
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
 *             $ref: '#/components/schemas/Schedule'
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Schedule'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Schedule not found
 */
scheduleRouter.put(
  '/:id',
  requireAuth,
  validateRequest(ScheduleSchema),
  scheduleController.updateSchedule,
)

/**
 * @swagger
 * /schedule/{id}:
 *   delete:
 *     tags:
 *       - Schedules
 *     summary: Delete a schedule by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Schedule deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Schedule not found
 */
scheduleRouter.delete('/:id', requireAuth, scheduleController.deleteSchedule)

export { scheduleRouter }
export default scheduleRouter
