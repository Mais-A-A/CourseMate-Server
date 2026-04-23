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
 *         - acdYear
 *         - semesterNo
 *         - courseNo
 *         - courseName
 *         - courseCredietHrs
 *         - sectionNo
 *       properties:
 *         acdYear:
 *           type: number
 *         semesterNo:
 *           type: number
 *         courseNo:
 *           type: number
 *         courseName:
 *           type: string
 *         courseCredietHrs:
 *           type: number
 *         sectionNo:
 *           type: number
 *         labSectionNo:
 *           type: number
 *           default: -1
 *         roomName:
 *           type: string
 *         buildingName:
 *           type: string
 *         supervisorName:
 *           type: string
 *         capacity:
 *           type: number
 *         counter:
 *           type: number
 *           default: 0
 *         majorNo:
 *           type: number
 *         isOpen:
 *           type: boolean
 *           default: true
 *         packageCaption:
 *           type: string
 *         secTime:
 *           type: string
 *         collageArabicName:
 *           type: string
 *         majorArabicName:
 *           type: string
 *         lSectionNo:
 *           type: string
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
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
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
  requireAuth(),
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
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
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
  requireAuth(),
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
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
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
  requireAuth(),
  requireRole('admin'),
  courseSectionController.deleteCourseSection,
)

export { courseSectionRouter }
export default courseSectionRouter
