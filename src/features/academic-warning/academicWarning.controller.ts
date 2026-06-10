import { academicWarningService } from './academicWarning.service.js'
import type { Request, Response } from 'express'

class AcademicWarningController {
  async createAcademicWarning(req: Request, res: Response) {
    try {
      const academicWarning =
        await academicWarningService.createAcademicWarning(req.body)
      res.status(201).json(academicWarning)
    } catch (error) {
      res.status(500).json({ error: 'Failed to create academic warning' })
    }
  }

  async getAcademicWarnings(req: Request, res: Response) {
    try {
      const academicWarnings =
        await academicWarningService.getAllAcademicWarnings()
      res.json(academicWarnings)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch academic warnings' })
    }
  }

  async getAcademicWarningById(req: Request, res: Response) {
    try {
      const academicWarning =
        await academicWarningService.getAcademicWarningById(
          req.params.id as string,
        )
      if (!academicWarning) {
        return res.status(404).json({ error: 'Academic warning not found' })
      }
      res.json(academicWarning)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch academic warning' })
    }
  }
  async getAcademicWarningsByWarningType(req: Request, res: Response) {
    try {
      const academicWarnings =
        await academicWarningService.getAcademicWarningsByWarningType(
          req.params.warningType as string,
        )
      res.json(academicWarnings)
    } catch (error) {
      res
        .status(500)
        .json({ error: 'Failed to fetch academic warnings by warning type' })
    }
  }
  async resolveAcademicWarning(req: Request, res: Response) {
    try {
      const academicWarning =
        await academicWarningService.resolveAcademicWarning(
          req.params.id as string,
        )
      if (!academicWarning) {
        return res.status(404).json({ error: 'Academic warning not found' })
      }
      res.json(academicWarning)
    } catch (error) {
      res.status(500).json({ error: 'Failed to resolve academic warning' })
    }
  }
  async getAcademicWarningsByUserId(req: Request, res: Response) {
    try {
      const academicWarnings =
        await academicWarningService.getAcademicWarningsByUserId(
          req.params.userId as string,
        )
      res.json(academicWarnings)
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch academic warnings for the specified user',
      })
    }
  }

  async updateAcademicWarning(req: Request, res: Response) {
    try {
      const academicWarning =
        await academicWarningService.updateAcademicWarning(
          req.params.id as string,
          req.body,
        )
      if (!academicWarning) {
        return res.status(404).json({ error: 'Academic warning not found' })
      }
      res.json(academicWarning)
    } catch (error) {
      res.status(500).json({ error: 'Failed to update academic warning' })
    }
  }

  async deleteAcademicWarning(req: Request, res: Response) {
    try {
      const academicWarning =
        await academicWarningService.deleteAcademicWarning(
          req.params.id as string,
        )
      if (!academicWarning) {
        return res.status(404).json({ error: 'Academic warning not found' })
      }
      res.json({ message: 'Academic warning deleted successfully' })
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete academic warning' })
    }
  }
}

export const academicWarningController = new AcademicWarningController()
export default academicWarningController
