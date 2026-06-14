import { Router } from 'express'
import { scheduleController } from './schedule.controller.js'
import { ScheduleSchema } from './schedule.schema.js'
import { validateRequest } from '../../shared/middlewares/validation.js'
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware.js'
const scheduleRouter = Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     Schedule:
 *       type: object
 *       required:
 *         - student_id
 *         - studentNo
 *         - academicYear
 *         - semesterNo
 *       properties:
 *         student_id:
 *           type: string
 *         studentNo:
 *           type: number
 *         academicYear:
 *           type: number
 *         academicYearTitle:
 *           type: string
 *         semesterNo:
 *           type: number
 *         semesterTitle:
 *           type: string
 *         semesterHours:
 *           type: number
 *         passHours:
 *           type: number
 *         semesterAverage:
 *           type: number
 *         majorAverage:
 *           type: number
 *         accumulativeAverage:
 *           type: number
 *         academicWarning:
 *           type: string
 *         academicStatus:
 *           type: string
 */

/**
 * @swagger
 * /schedule:
 *   get:
 *     tags:
 *       - Schedules
 *     summary: Get all schedules
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
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
scheduleRouter.get('/', requireAuth(), scheduleController.getSchedules)

/**
 * @swagger
 * /schedule/{id}:
 *   get:
 *     tags:
 *       - Schedules
 *     summary: Get a schedule by ID
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
scheduleRouter.get('/:id', requireAuth(), scheduleController.getScheduleById)

/**
 * @swagger
 * /schedule:
 *   post:
 *     tags:
 *       - Schedules
 *     summary: Create a new schedule
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
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
  requireAuth(),
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
  requireAuth(),
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
 *         description: Schedule deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Schedule not found
 */
scheduleRouter.delete('/:id', requireAuth(), scheduleController.deleteSchedule)

export { scheduleRouter }
export default scheduleRouter
