import { Schedule } from '../models/schedule.model.js'
import type { Schedule as ScheduleType } from '../schemas/schedule.schema.js'

class ScheduleService {
  async createSchedule(scheduleData: ScheduleType) {
    const schedule = new Schedule(scheduleData)
    return await schedule.save()
  }
  
  async getAllSchedules() {
    return await Schedule.find().lean()
  }

  async getScheduleById(scheduleId: string) {
    return await Schedule.findById(scheduleId).lean()
  }

  async updateSchedule(scheduleId: string, scheduleData: Partial<ScheduleType>) {
    return await Schedule.findByIdAndUpdate(scheduleId, scheduleData, { new: true })
  }

  async deleteSchedule(scheduleId: string) {
    return await Schedule.findByIdAndDelete(scheduleId)
  }
}

export const scheduleService = new ScheduleService()
export default scheduleService