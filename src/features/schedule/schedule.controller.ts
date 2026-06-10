import { scheduleService } from './schedule.service.js'
import type { Request, Response } from 'express'

class ScheduleController {
  async createSchedule(req: Request, res: Response) {
    try {
      const schedule = await scheduleService.createSchedule(req.body)
      res.status(201).json(schedule)
    } catch (error) {
      res.status(500).json({ error: 'Failed to create schedule' })
    }
  }

  async getSchedules(req: Request, res: Response) {
    try {
      const schedules = await scheduleService.getAllSchedules()
      res.json(schedules)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch schedules' })
    }
  }

  async getScheduleById(req: Request, res: Response) {
    try {
      const schedule = await scheduleService.getScheduleById(req.params.id as string)
      if (!schedule) return res.status(404).json({ error: 'Schedule not found' })
      res.json(schedule)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch schedule' })
    }
  }

  async updateSchedule(req: Request, res: Response) {
    try {
      const schedule = await scheduleService.updateSchedule(req.params.id as string, req.body)
      if (!schedule) return res.status(404).json({ error: 'Schedule not found' })
      res.json(schedule)
    } catch (error) {
      res.status(500).json({ error: 'Failed to update schedule' })
    }
  }

  async deleteSchedule(req: Request, res: Response) {
    try {
      const schedule = await scheduleService.deleteSchedule(req.params.id as string)
      if (!schedule) return res.status(404).json({ error: 'Schedule not found' })
      res.json({ message: 'Schedule deleted successfully' })
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete schedule' })
    }
  }
}

export const scheduleController = new ScheduleController()
export default scheduleController