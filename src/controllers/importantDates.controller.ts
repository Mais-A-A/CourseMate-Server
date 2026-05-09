import { importantDatesService } from '../services/importantDates.service.js'
import type { Response, Request } from 'express'
class ImportantDatesController {
  async createImportantDate(req: Request, res: Response) {
    try {
      const importantDate = await importantDatesService.createImportantDate(
        req.body,
      )
      res.status(201).json(importantDate)
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }
  async getAllImportantDates(req: Request, res: Response) {
    try {
      const importantDates = await importantDatesService.getAllImportantDates()
      res.json(importantDates)
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }
  async getImportantDateById(req: Request, res: Response) {
    try {
      const importantDate = await importantDatesService.getImportantDateById(
        req.params.id as string,
      )
      if (!importantDate) {
        return res.status(404).json({ error: 'Important date not found' })
      }
      res.json(importantDate)
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }
  async getImportantDatesByType(req: Request, res: Response) {
    try {
      const importantDates =
        await importantDatesService.getImportantDatesByType(
          req.params.type as string,
        )
      res.json(importantDates)
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }
  async getUpcomingImportantDates(req: Request, res: Response) {
    try {
      const upcomingImportantDates =
        await importantDatesService.getUpcomingImportantDates()
      res.json(upcomingImportantDates)
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }
  async updateImportantDate(req: Request, res: Response) {
    try {
      const updatedImportantDate =
        await importantDatesService.updateImportantDate(
          req.params.id as string,
          req.body,
        )
      if (!updatedImportantDate) {
        return res.status(404).json({ error: 'Important date not found' })
      }
      res.json(updatedImportantDate)
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }
  async deleteImportantDate(req: Request, res: Response) {
    try {
      const deleted = await importantDatesService.deleteImportantDate(
        req.params.id as string,
      )
      if (!deleted) {
        return res.status(404).json({ error: 'Important date not found' })
      }
      res.json({ message: 'Important date deleted successfully' })
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }

  async deleteAllImportantDates(req: Request, res: Response) {
    try {
      await importantDatesService.deleteAllImportantDates()
      res.json({ message: 'All important dates deleted successfully' })
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }
}

export const importantDatesController = new ImportantDatesController()
export default importantDatesController
