import { academicPlanService } from '../services/academicPlan.service.js'
import type { Request, Response } from 'express'

class AcademicPlanController {
  async createAcademicPlan(req: Request, res: Response) {
    try {
      const academicPlan = await academicPlanService.createAcademicPlan(
        req.body,
      )
      res.status(201).json(academicPlan)
    } catch (error) {
      res.status(500).json({ error: 'Failed to create academic plan' })
    }
  }

  async getAcademicPlans(req: Request, res: Response) {
    try {
      const academicPlans =
        await academicPlanService.getAllAcademicPlans()
      res.json(academicPlans)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch academic plans' })
    }
  }

  async getAcademicPlanById(req: Request, res: Response) {
    try {
      const academicPlan =
        await academicPlanService.getAcademicPlanById(
          req.params.id as string,
        )

      if (!academicPlan) {
        return res.status(404).json({ error: 'Academic plan not found' })
      }

      res.json(academicPlan)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch academic plan' })
    }
  }

  async updateAcademicPlan(req: Request, res: Response) {
    try {
      const academicPlan =
        await academicPlanService.updateAcademicPlan(
          req.params.id as string,
          req.body,
        )

      if (!academicPlan) {
        return res.status(404).json({ error: 'Academic plan not found' })
      }

      res.json(academicPlan)
    } catch (error) {
      res.status(500).json({ error: 'Failed to update academic plan' })
    }
  }

  async deleteAcademicPlan(req: Request, res: Response) {
    try {
      const academicPlan =
        await academicPlanService.deleteAcademicPlan(
          req.params.id as string,
        )

      if (!academicPlan) {
        return res.status(404).json({ error: 'Academic plan not found' })
      }

      res.json({ message: 'Academic plan deleted successfully' })
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete academic plan' })
    }
  }
}

export const academicPlanController = new AcademicPlanController()
export default academicPlanController