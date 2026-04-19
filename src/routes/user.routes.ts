import { userController } from '../controllers/user.controller.js'
import { Router } from 'express'
import { userSchema } from '../schemas/user.schemas.js'
import { validateRequest } from '../middlewares/validation.js'
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js'
const userRouter = Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     CompletedCourse:
 *       type: object
 *       required:
 *         - course_id
 *         - course_name
 *         - grade
 *       properties:
 *         course_id:
 *           type: string
 *         course_name:
 *           type: string
 *         grade:
 *           type: string
 *
 *     StudentData:
 *       type: object
 *       properties:
 *         completed_courses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CompletedCourse'
 *           default: []
 *         gpa:
 *           type: number
 *           minimum: 45.0
 *           maximum: 100.0
 *         academic_plan:
 *           type: string
 *         notifications:
 *           type: array
 *           items:
 *             type: string
 *
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - role
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         role:
 *           type: string
 *           enum: [student, admin, supervisor]
 *           default: student
 *         student_data:
 *           $ref: '#/components/schemas/StudentData'
 */

/**
 * @swagger
 * /user:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
userRouter.get('/', requireAuth, userController.getAllUsers)

/**
 * @swagger
 * /user/search:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get a user by email
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         example: test@example.com
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Email is required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
userRouter.get('/search', requireAuth, userController.getUserByEmail)

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
userRouter.get('/:id', requireAuth, userController.getUserById)

/**
 * @swagger
 * /user:
 *   post:
 *     tags:
 *       - Users
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
userRouter.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validateRequest(userSchema),
  userController.createUser,
)

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update a user by ID
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
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
userRouter.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validateRequest(userSchema),
  userController.updateUser,
)

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
userRouter.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  userController.deleteUser,
)

export { userRouter }
export default userRouter
