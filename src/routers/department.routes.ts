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
 */
departmentRouter.get('/', departmentController.getDepartments)

/**
 * @swagger
 * /departments/{id}:
 *   get:
 *     tags:
 *       - Departments
 *     summary: Get department by ID
 */
departmentRouter.get('/:id', departmentController.getDepartmentById)

/**
 * @swagger
 * /departments:
 *   post:
 *     tags:
 *       - Departments
 *     summary: Create a new department
 */
departmentRouter.post('/', departmentController.createDepartment)

/**
 * @swagger
 * /departments/{id}:
 *   put:
 *     tags:
 *       - Departments
 *     summary: Update a department
 */
departmentRouter.put('/:id', departmentController.updateDepartment)

/**
 * @swagger
 * /departments/{id}:
 *   delete:
 *     tags:
 *       - Departments
 *     summary: Delete a department
 */
departmentRouter.delete('/:id', departmentController.deleteDepartment)

export { departmentRouter }
export default departmentRouter