import e from 'express'
import { academicRuleService } from '../services/academicRule.service.js'
import type { Request, Response } from 'express'

class AcademicRuleController {
  async createAcademicRule(req: Request, res: Response) {
    try {
      const academicRule = await academicRuleService.createAcademicRule(
        req.body,
      )
      res.status(201).json(academicRule)
    } catch (error) {
      res.status(500).json({ error: 'Failed to create academic rule' })
    }
  }

  async getAcademicRules(req: Request, res: Response) {
    try {
      const academicRules = await academicRuleService.getAllAcademicRules()
      res.json(academicRules)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch academic rules' })
    }
  }

  async getAcademicRuleById(req: Request, res: Response) {
    try {
      const academicRule = await academicRuleService.getAcademicRuleById(
        req.params.id as string,
      )
      if (!academicRule) {
        return res.status(404).json({ error: 'Academic rule not found' })
      }
      res.json(academicRule)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch academic rule' })
    }
  }

  async updateAcademicRule(req: Request, res: Response) {
    try {
      const academicRule = await academicRuleService.updateAcademicRule(
        req.params.id as string,
        req.body,
      )
      if (!academicRule) {
        return res.status(404).json({ error: 'Academic rule not found' })
      }
      res.json(academicRule)
    } catch (error) {
      res.status(500).json({ error: 'Failed to update academic rule' })
    }
  }

  async deleteAcademicRule(req: Request, res: Response) {
    try {
      const academicRule = await academicRuleService.deleteAcademicRule(
        req.params.id as string,
      )
      if (!academicRule) {
        return res.status(404).json({ error: 'Academic rule not found' })
      }
      res.json({ message: 'Academic rule deleted successfully' })
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete academic rule' })
    }
  }
}

export const academicRuleController = new AcademicRuleController()
export default academicRuleController
