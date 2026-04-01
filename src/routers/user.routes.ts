import { userController } from '../controllers/user.controller.js'
import { Router } from 'express'
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
 * /users:
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
 *       500:
 *         description: Internal server error
 */
userRouter.get('/', userController.getAllUsers)

/**
 * @swagger
 * /users/search:
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
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
userRouter.get('/search', userController.getUserByEmail)

/**
 * @swagger
 * /users/{id}:
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
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
userRouter.get('/:id', userController.getUserById)

/**
 * @swagger
 * /users:
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
 *       500:
 *         description: Internal server error
 */
userRouter.post('/', userController.createUser)

/**
 * @swagger
 * /users/{id}:
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
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
userRouter.put('/:id', userController.updateUser)

/**
 * @swagger
 * /users/{id}:
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
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
userRouter.delete('/:id', userController.deleteUser)

export { userRouter }
export default userRouter
