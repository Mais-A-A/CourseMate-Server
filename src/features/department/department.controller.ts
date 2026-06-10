import type{ Request, Response } from 'express'
import { departmentService } from './department.service.js'

class DepartmentController {
  async createDepartment(req: Request, res: Response) {
    try {
      const dept = await departmentService.createDepartment(req.body)
      res.status(201).json(dept)
    } catch (error) {
      res.status(500).json({ error: 'Failed to create department' })
    }
  }

  async getDepartments(req: Request, res: Response) {
    try {
      const depts = await departmentService.getAllDepartments()
      res.json(depts)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch departments' })
    }
  }

  async getDepartmentById(req: Request, res: Response) {
    try {
      const dept = await departmentService.getDepartmentById(req.params.id as string)
      if (!dept) return res.status(404).json({ error: 'Department not found' })
      res.json(dept)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch department' })
    }
  }

  async updateDepartment(req: Request, res: Response) {
    try {
      const dept = await departmentService.updateDepartment(req.params.id as string, req.body)
      if (!dept) return res.status(404).json({ error: 'Department not found' })
      res.json(dept)
    } catch (error) {
      res.status(500).json({ error: 'Failed to update department' })
    }
  }

  async deleteDepartment(req: Request, res: Response) {
    try {
      const dept = await departmentService.deleteDepartment(req.params.id as string)
      if (!dept) return res.status(404).json({ error: 'Department not found' })
      res.json({ message: 'Department deleted successfully' })
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete department' })
    }
  }
}

export const departmentController = new DepartmentController()
export default departmentController