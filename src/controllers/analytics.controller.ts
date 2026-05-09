import type { Request, Response } from 'express'
import { getAnalytics } from '../services/analytics.service.js'

class AnalyticsController {
  async getAnalytics(_req: Request, res: Response) {
    try {
      const data = await getAnalytics()
      res.json(data)
    } catch (error) {
      res.status(500).json({ message: 'Error fetching analytics', error })
    }
  }
}

export const analyticsController = new AnalyticsController()
export default analyticsController
