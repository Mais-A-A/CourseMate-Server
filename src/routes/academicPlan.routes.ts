import { academicPlanController } from '../controllers/academicPlan.controller.js'
import { Router } from 'express'
import { AcademicPlanSchema } from '../schemas/academicPlan.schema.js'
import { validateRequest } from '../middlewares/validation.js'
import {
  requireAuth,
  requireRole,
  requireAuthorizeUserOrHigher,
} from '../middlewares/auth.middleware.js'
const academicPlanRouter = Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     CourseGrade:
 *       type: object
 *       properties:
 *         gradeNGrade:
 *           type: number
 *         gradeResultGrade:
 *           type: string
 *         courseTaken:
 *           type: number
 *         gradeCGrade:
 *           type: string
 *
 *     CourseInGroup:
 *       type: object
 *       required:
 *         - courseNo
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
 *         courseGrades:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CourseGrade'
 *           default: []
 *
 *     PlanGroup:
 *       type: object
 *       properties:
 *         groupArabicName:
 *           type: string
 *         groupEnglishName:
 *           type: string
 *         groupNo:
 *           type: number
 *         calcMajorAvg:
 *           type: boolean
 *         requiredHours:
 *           type: number
 *         passedHours:
 *           type: number
 *         medicineCourses:
 *           type: boolean
 *         planYear:
 *           type: number
 *         majorNo:
 *           type: number
 *         groupCoursList:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CourseInGroup'
 *           default: []
 *
 *     AcademicPlan:
 *       type: object
 *       required:
 *         - majorNo
 *         - planYear
 *       properties:
 *         majorNo:
 *           type: number
 *         planYear:
 *           type: number
 *         majorArabicName:
 *           type: string
 *         groups:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PlanGroup'
 *           default: []
 */

/**
 * @swagger
 * /academic-plan:
 *   get:
 *     tags:
 *       - Academic Plans
 *     summary: Get all academic plans
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all academic plans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AcademicPlan'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
academicPlanRouter.get(
  '/',
  requireAuth(),
  academicPlanController.getAcademicPlans,
)

/**
 * @swagger
 * /academic-plan/{id}:
 *   get:
 *     tags:
 *       - Academic Plans
 *     summary: Get an academic plan by ID
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
 *         description: Academic plan found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicPlan'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Academic plan not found
 *       500:
 *         description: Internal server error
 */
academicPlanRouter.get(
  '/:id',
  requireAuth(),
  academicPlanController.getAcademicPlanById,
)

/**
 * @swagger
 * /academic-plan:
 *   post:
 *     tags:
 *       - Academic Plans
 *     summary: Create a new academic plan
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AcademicPlan'
 *     responses:
 *       201:
 *         description: Academic plan created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicPlan'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
academicPlanRouter.post(
  '/',
  requireAuth(),
  requireRole('admin'),
  validateRequest(AcademicPlanSchema),
  academicPlanController.createAcademicPlan,
)

/**
 * @swagger
 * /academic-plan/{id}:
 *   put:
 *     tags:
 *       - Academic Plans
 *     summary: Update an academic plan by ID
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
 *             $ref: '#/components/schemas/AcademicPlan'
 *     responses:
 *       200:
 *         description: Academic plan updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicPlan'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Academic plan not found
 *       500:
 *         description: Internal server error
 */
academicPlanRouter.put(
  '/:id',
  requireAuth(),
  requireRole('admin'),
  validateRequest(AcademicPlanSchema),
  academicPlanController.updateAcademicPlan,
)

/**
 * @swagger
 * /academic-plan/{id}:
 *   delete:
 *     tags:
 *       - Academic Plans
 *     summary: Delete an academic plan by ID
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
 *         description: Academic plan deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Academic plan not found
 *       500:
 *         description: Internal server error
 */
academicPlanRouter.delete(
  '/:id',
  requireAuth(),
  requireRole('admin'),
  academicPlanController.deleteAcademicPlan,
)

export { academicPlanRouter }
export default academicPlanRouter
