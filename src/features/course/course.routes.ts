import { Router } from 'express'
import { courseController } from './course.controller.js'
import { CourseSchema } from './course.schema.js'
import { validateRequest } from '../../shared/middlewares/validation.js'
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware.js'
const courseRouter = Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       required:
 *         - courseNo
 *         - coursesArabicName
 *         - coursesCreditHours
 *       properties:
 *         courseNo:
 *           type: number
 *         coursesArabicName:
 *           type: string
 *         coursesCreditHours:
 *           type: number
 *         courseLevel:
 *           type: number
 *         courseOrder:
 *           type: number
 *         courseSemester:
 *           type: number
 *           nullable: true
 *         courseYear:
 *           type: number
 *           nullable: true
 *         preCourse:
 *           type: array
 *           items:
 *             type: number
 *           default: []
 *         department_id:
 *           type: string
 */

/**
 * @swagger
 * /course:
 *   get:
 *     tags:
 *       - Courses
 *     summary: Get all courses
 *     responses:
 *       200:
 *         description: List of courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Course'
 */
courseRouter.get('/', courseController.getCourses)

/**
 * @swagger
 * /course/{id}:
 *   get:
 *     tags:
 *       - Courses
 *     summary: Get a course by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 */
courseRouter.get('/:id', courseController.getCourseById)

/**
 * @swagger
 * /course:
 *   post:
 *     tags:
 *       - Courses
 *     summary: Create a new course
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Course'
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
courseRouter.post(
  '/',
  requireAuth(),
  requireRole('admin'),
  validateRequest(CourseSchema),
  courseController.createCourse,
)

/**
 * @swagger
 * /course/{id}:
 *   put:
 *     tags:
 *       - Courses
 *     summary: Update a course by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Course'
 *     responses:
 *       200:
 *         description: Course updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Course not found
 */
courseRouter.put(
  '/:id',
  requireAuth(),
  requireRole('admin'),
  validateRequest(CourseSchema),
  courseController.updateCourse,
)

/**
 * @swagger
 * /course/{id}:
 *   delete:
 *     tags:
 *       - Courses
 *     summary: Delete a course by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Course not found
 */
courseRouter.delete(
  '/:id',
  requireAuth(),
  requireRole('admin'),
  courseController.deleteCourse,
)

export { courseRouter }
export default courseRouter
