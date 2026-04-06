import { Router } from 'express'
import { courseController } from '../controllers/course.controller.js'

const courseRouter = Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       required:
 *         - course_code
 *         - title
 *         - credits
 *         - department_id
 *         - plan_id
 *       properties:
 *         course_code:
 *           type: string
 *         title:
 *           type: string
 *         credits:
 *           type: number
 *         department_id:
 *           type: string
 *         diffeculty_level:
 *           type: string
 *           enum: [low, moderate, high]
 *         plan_id:
 *           type: string
 *         estimated:
 *           type: number
 */

/**
 * @swagger
 * /courses:
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
 * /courses/{id}:
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
 * /courses:
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
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       400:
 *         description: Validation error
 */
courseRouter.post('/', courseController.createCourse)

/**
 * @swagger
 * /courses/{id}:
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
 *       404:
 *         description: Course not found
 */
courseRouter.put('/:id', courseController.updateCourse)

/**
 * @swagger
 * /courses/{id}:
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
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       404:
 *         description: Course not found
 */
courseRouter.delete('/:id', courseController.deleteCourse)

export { courseRouter }
export default courseRouter