import AIRecomendationModel from './AIRecomendation.model.js'
import type { AIRecomendation as AIRecomendationType } from './AIRecomendation.schema.js'

class AIRecomendationService {
  async createAIRecomendation(data: AIRecomendationType) {
    const recommendation = new AIRecomendationModel(data)
    return await recommendation.save()
  }

  async getAllAIRecomendations() {
    return await AIRecomendationModel.find().lean()
  }

  async getAIRecomendationById(id: string) {
    return await AIRecomendationModel.findById(id).lean()
  }

  async updateAIRecomendation(
    id: string,
    data: Partial<AIRecomendationType>,
  ) {
    return await AIRecomendationModel.findByIdAndUpdate(id, data, {
      new: true,
    })
  }

  async deleteAIRecomendation(id: string) {
    return await AIRecomendationModel.findByIdAndDelete(id)
  }
}

export const aiRecomendationService = new AIRecomendationService()
export default aiRecomendationService