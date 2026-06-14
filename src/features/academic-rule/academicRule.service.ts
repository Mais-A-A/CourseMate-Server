import { AcademicRule } from './academicRule.model.js'
import type { AcademicRule as AcademicRuleType } from './academicRule.schema.js'

class AcademicRuleService {
  async createAcademicRule(ruleData: AcademicRuleType) {
    const rule = new AcademicRule(ruleData)
    return await rule.save()
  }

  async getAllAcademicRules() {
    return await AcademicRule.find().lean()
  }

  async getAcademicRuleById(ruleId: string) {
    return await AcademicRule.findById(ruleId).lean()
  }

  async updateAcademicRule(
    ruleId: string,
    ruleData: Partial<AcademicRuleType>,
  ) {
    return await AcademicRule.findByIdAndUpdate(ruleId, ruleData, {
      new: true,
    })
  }

  async deleteAcademicRule(ruleId: string) {
    return await AcademicRule.findByIdAndDelete(ruleId)
  }
}
export const academicRuleService = new AcademicRuleService()
export default academicRuleService
