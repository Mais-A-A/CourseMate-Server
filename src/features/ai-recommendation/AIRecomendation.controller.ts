import { aiRecomendationService } from './AIRecomendation.service.js'
import type { Request, Response } from 'express'

class AIRecomendationController {
  async createAIRecomendation(req: Request, res: Response) {
    try {
      const data = await aiRecomendationService.createAIRecomendation(req.body)
      res.status(201).json(data)
    } catch (error) {
      res.status(500).json({ error: 'Failed to create AI recommendation' })
    }
  }

  async getAIRecomendations(_req: Request, res: Response) {
    try {
      const data = await aiRecomendationService.getAllAIRecomendations()
      res.json(data)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch AI recommendations' })
    }
  }

  async getAIRecomendationById(req: Request, res: Response) {
    try {
      const data = await aiRecomendationService.getAIRecomendationById(
        req.params.id as string,
      )

      if (!data) {
        return res.status(404).json({ error: 'AI recommendation not found' })
      }

      res.json(data)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch AI recommendation' })
    }
  }

  async updateAIRecomendation(req: Request, res: Response) {
    try {
      const data = await aiRecomendationService.updateAIRecomendation(
        req.params.id as string,
        req.body,
      )

      if (!data) {
        return res.status(404).json({ error: 'AI recommendation not found' })
      }

      res.json(data)
    } catch (error) {
      res.status(500).json({ error: 'Failed to update AI recommendation' })
    }
  }

  async deleteAIRecomendation(req: Request, res: Response) {
    try {
      const data = await aiRecomendationService.deleteAIRecomendation(
        req.params.id as string,
      )

      if (!data) {
        return res.status(404).json({ error: 'AI recommendation not found' })
      }

      res.json({ message: 'AI recommendation deleted successfully' })
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete AI recommendation' })
    }
  }
}

export const aiRecomendationController = new AIRecomendationController()
export default aiRecomendationController
