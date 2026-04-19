import { Router } from 'express'
import { courseSectionController } from '../controllers/courseSection.controller.js'
import { CourseSectionSchema } from '../schemas/courseSection.schema.js'
import { validateRequest } from '../middlewares/validation.js'
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js'
const courseSectionRouter = Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     CourseSection:
 *       type: object
 *       required:
 *         - course_id
 *         - semester_id
 *         - instructor
 *         - class_days
 *         - start_time
 *         - end_time
 *         - classroom
 *         - capacity
 *         - available_seats
 *       properties:
 *         course_id:
 *           type: string
 *         semester_id:
 *           type: string
 *         instructor:
 *           type: string
 *         class_days:
 *           type: array
 *           items:
 *             type: string
 *             enum: [Sat, Sun, Mon, Tue, Wed, Thu]
 *         start_time:
 *           type: string
 *         end_time:
 *           type: string
 *         classroom:
 *           type: string
 *         capacity:
 *           type: number
 *         available_seats:
 *           type: number
 */

/**
 * @swagger
 * /course-section:
 *   get:
 *     tags:
 *       - Course Sections
 *     summary: Get all course sections
 *     responses:
 *       200:
 *         description: List of all course sections
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CourseSection'
 */
courseSectionRouter.get('/', courseSectionController.getCourseSections)

/**
 * @swagger
 * /course-section/{id}:
 *   get:
 *     tags:
 *       - Course Sections
 *     summary: Get a course section by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course section found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CourseSection'
 *       404:
 *         description: Course section not found
 */
courseSectionRouter.get('/:id', courseSectionController.getCourseSectionById)

/**
 * @swagger
 * /course-section:
 *   post:
 *     tags:
 *       - Course Sections
 *     summary: Create a new course section
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseSection'
 *     responses:
 *       201:
 *         description: Course section created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CourseSection'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
courseSectionRouter.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validateRequest(CourseSectionSchema),
  courseSectionController.createCourseSection,
)

/**
 * @swagger
 * /course-section/{id}:
 *   put:
 *     tags:
 *       - Course Sections
 *     summary: Update a course section by ID
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
 *             $ref: '#/components/schemas/CourseSection'
 *     responses:
 *       200:
 *         description: Course section updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CourseSection'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Course section not found
 */
courseSectionRouter.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validateRequest(CourseSectionSchema),
  courseSectionController.updateCourseSection,
)

/**
 * @swagger
 * /course-section/{id}:
 *   delete:
 *     tags:
 *       - Course Sections
 *     summary: Delete a course section by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course section deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Course section not found
 */
courseSectionRouter.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  courseSectionController.deleteCourseSection,
)

export { courseSectionRouter }
export default courseSectionRouter
