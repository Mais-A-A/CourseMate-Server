import AcademicPlanModel from './academicPlan.model.js'
import type { AcademicPlan as AcademicPlanType } from './academicPlan.schema.js'

class AcademicPlanService {
  async createAcademicPlan(planData: AcademicPlanType) {
    const plan = new AcademicPlanModel(planData)
    return await plan.save()
  }

  async getAllAcademicPlans() {
    return await AcademicPlanModel.find().lean()
  }

  async getAcademicPlanById(planId: string) {
    return await AcademicPlanModel.findById(planId).lean()
  }

  async updateAcademicPlan(
    planId: string,
    planData: Partial<AcademicPlanType>,
  ) {
    return await AcademicPlanModel.findByIdAndUpdate(planId, planData, {
      new: true,
    })
  }

  async deleteAcademicPlan(planId: string) {
    return await AcademicPlanModel.findByIdAndDelete(planId)
  }
}

export const academicPlanService = new AcademicPlanService()
export default academicPlanService