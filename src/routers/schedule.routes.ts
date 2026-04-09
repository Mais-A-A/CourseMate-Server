import { Router } from 'express'
import { scheduleController } from '../controllers/schedule.controller.js'

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
 * /schedules:
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
 */
scheduleRouter.get('/', scheduleController.getSchedules)

/**
 * @swagger
 * /schedules/{id}:
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
 *       404:
 *         description: Schedule not found
 */
scheduleRouter.get('/:id', scheduleController.getScheduleById)

/**
 * @swagger
 * /schedules:
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
 */
scheduleRouter.post('/', scheduleController.createSchedule)

/**
 * @swagger
 * /schedules/{id}:
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
 *       404:
 *         description: Schedule not found
 */
scheduleRouter.put('/:id', scheduleController.updateSchedule)

/**
 * @swagger
 * /schedules/{id}:
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
 *       404:
 *         description: Schedule not found
 */
scheduleRouter.delete('/:id', scheduleController.deleteSchedule)

export { scheduleRouter }
export default scheduleRouter