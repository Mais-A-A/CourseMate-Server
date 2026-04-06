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
 */
scheduleRouter.get('/', scheduleController.getSchedules)

/**
 * @swagger
 * /schedules/{id}:
 *   get:
 *     tags:
 *       - Schedules
 *     summary: Get schedule by ID
 */
scheduleRouter.get('/:id', scheduleController.getScheduleById)

/**
 * @swagger
 * /schedules:
 *   post:
 *     tags:
 *       - Schedules
 *     summary: Create a new schedule
 */
scheduleRouter.post('/', scheduleController.createSchedule)

/**
 * @swagger
 * /schedules/{id}:
 *   put:
 *     tags:
 *       - Schedules
 *     summary: Update a schedule
 */
scheduleRouter.put('/:id', scheduleController.updateSchedule)

/**
 * @swagger
 * /schedules/{id}:
 *   delete:
 *     tags:
 *       - Schedules
 *     summary: Delete a schedule
 */
scheduleRouter.delete('/:id', scheduleController.deleteSchedule)

export { scheduleRouter }
export default scheduleRouter