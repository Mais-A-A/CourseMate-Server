import { ImportantDate } from './importantDates.model.js'
import type { ImportantDateType } from './importantDates.schema.js'

class ImportantDatesService {
  async createImportantDate(dataDate: ImportantDateType) {
    const importantDate = new ImportantDate(dataDate)
    return await importantDate.save()
  }
  async getAllImportantDates() {
    return await ImportantDate.find().lean()
  }
  async getImportantDateById(id: string) {
    return await ImportantDate.findById(id).lean()
  }
  async getImportantDatesByType(type: string) {
    return await ImportantDate.find({ type }).lean()
  }
  async updateImportantDate(
    id: string,
    updateData: Partial<ImportantDateType>,
  ) {
    return await ImportantDate.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean()
  }
  async deleteImportantDate(id: string) {
    return await ImportantDate.findByIdAndDelete(id).lean()
  }
  async getUpcomingImportantDates() {
    const today = new Date()
    return await ImportantDate.find({ date: { $gte: today } })
      .sort({ date: 1 })
      .lean()
  }
  async deleteAllImportantDates() {
    return await ImportantDate.deleteMany({})
  }
}

export const importantDatesService = new ImportantDatesService()
export default importantDatesService
