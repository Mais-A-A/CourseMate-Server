import { Router } from 'express'
import { departmentController } from '../controllers/department.controller.js'

const departmentRouter = Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     Department:
 *       type: object
 *       required:
 *         - department_name
 *         - dean_name
 *       properties:
 *         department_name:
 *           type: string
 *         dean_name:
 *           type: string
 */

/**
 * @swagger
 * /departments:
 *   get:
 *     tags:
 *       - Departments
 *     summary: Get all departments
 *     responses:
 *       200:
 *         description: List of all departments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Department'
 */
departmentRouter.get('/', departmentController.getDepartments)

/**
 * @swagger
 * /departments/{id}:
 *   get:
 *     tags:
 *       - Departments
 *     summary: Get a department by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Department found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Department'
 *       404:
 *         description: Department not found
 */
departmentRouter.get('/:id', departmentController.getDepartmentById)

/**
 * @swagger
 * /departments:
 *   post:
 *     tags:
 *       - Departments
 *     summary: Create a new department
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Department'
 *     responses:
 *       201:
 *         description: Department created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Department'
 *       400:
 *         description: Validation error
 */
departmentRouter.post('/', departmentController.createDepartment)

/**
 * @swagger
 * /departments/{id}:
 *   put:
 *     tags:
 *       - Departments
 *     summary: Update a department by ID
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
 *             $ref: '#/components/schemas/Department'
 *     responses:
 *       200:
 *         description: Department updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Department'
 *       404:
 *         description: Department not found
 */
departmentRouter.put('/:id', departmentController.updateDepartment)

/**
 * @swagger
 * /departments/{id}:
 *   delete:
 *     tags:
 *       - Departments
 *     summary: Delete a department by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Department deleted successfully
 *       404:
 *         description: Department not found
 */
departmentRouter.delete('/:id', departmentController.deleteDepartment)

export { departmentRouter }
export default departmentRouter