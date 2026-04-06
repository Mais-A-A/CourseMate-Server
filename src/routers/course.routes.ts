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
 */
courseRouter.get('/', courseController.getCourses)

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     tags:
 *       - Courses
 *     summary: Get course by ID
 */
courseRouter.get('/:id', courseController.getCourseById)

/**
 * @swagger
 * /courses:
 *   post:
 *     tags:
 *       - Courses
 *     summary: Create a new course
 */
courseRouter.post('/', courseController.createCourse)

/**
 * @swagger
 * /courses/{id}:
 *   put:
 *     tags:
 *       - Courses
 *     summary: Update a course
 */
courseRouter.put('/:id', courseController.updateCourse)

/**
 * @swagger
 * /courses/{id}:
 *   delete:
 *     tags:
 *       - Courses
 *     summary: Delete a course
 */
courseRouter.delete('/:id', courseController.deleteCourse)

export { courseRouter }
export default courseRouter