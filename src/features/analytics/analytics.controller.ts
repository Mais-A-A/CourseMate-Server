import type { Request, Response } from 'express'
import { getAnalytics, getUsageAnalytics } from './analytics.service.js'

class AnalyticsController {
  async getAnalytics(_req: Request, res: Response) {
    try {
      const data = await getAnalytics()
      res.json(data)
    } catch (error) {
      res.status(500).json({ message: 'Error fetching analytics', error })
    }
  }

  async getUsage(req: Request, res: Response) {
    const days = Math.min(Math.max(Math.floor(Number(req.query.days ?? 30)) || 30, 1), 180)
    try {
      res.json({ success: true, data: await getUsageAnalytics(days) })
    } catch (error) {
      console.error('[Analytics] usage failed:', error)
      res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' })
    }
  }
}

export const analyticsController = new AnalyticsController()
export default analyticsController
