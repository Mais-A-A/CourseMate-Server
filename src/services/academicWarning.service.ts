import { AcademicWarning } from '../models/academicWarning.model.js'
import type { AcademicWarning as AcademicWarningType } from '../schemas/academicWarning.schema.js'

class AcademicWarningService {
  async createAcademicWarning(warningData: AcademicWarningType) {
    const warning = new AcademicWarning(warningData)
    return await warning.save()
  }

  async getAllAcademicWarnings() {
    
    return await AcademicWarning.find().lean()
  }

  async getAcademicWarningById(warningId: string) {
    return await AcademicWarning.findById(warningId).lean()
  }

  async getAcademicWarningsByWarningType(warningType: string) {
    return await AcademicWarning.find({ warning_type: warningType }).lean()
  }

  async updateAcademicWarning(
    warningId: string,
    warningData: Partial<AcademicWarningType>,
  ) {
    return await AcademicWarning.findByIdAndUpdate(warningId, warningData, {
      new: true,
    })
  }

  async getAcademicWarningsByUserId(userId: string) {
    return await AcademicWarning.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .lean()
  }

  async resolveAcademicWarning(warningId: string) {
    return await AcademicWarning.findByIdAndUpdate(
      warningId,
      { is_resolved: true, resolved_at: new Date() },
      { new: true, runValidators: true },
    )
  }

  async deleteAcademicWarning(warningId: string) {
    return await AcademicWarning.findByIdAndDelete(warningId)
  }
}
export const academicWarningService = new AcademicWarningService()
export default academicWarningService
