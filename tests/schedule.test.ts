import { describe, it, expect, beforeEach } from 'vitest'
import mongoose from 'mongoose'
import { scheduleService } from '../src/features/schedule/schedule.service.js'
import { Schedule } from '../src/features/schedule/schedule.model.js'
import type { Schedule as ScheduleType } from '../src/features/schedule/schedule.schema.js'

describe('Schedule Service', () => {
  beforeEach(async () => {
    await Schedule.deleteMany()
  })

  const mockSchedule: ScheduleType = {
    student_id: new mongoose.Types.ObjectId().toString(),
    studentNo: 1001,
    academicYear: 2025,
    academicYearTitle: '2025/2026',
    semesterNo: 1,
    semesterTitle: 'Fall',
  }

  it('should create schedule', async () => {
    const result = await scheduleService.createSchedule(mockSchedule)

    expect(result).toBeDefined()
    expect(result._id).toBeDefined()
    expect(result.semesterNo).toBe(1)
  })

  it('should get all schedules', async () => {
    await scheduleService.createSchedule(mockSchedule)

    const schedules = await scheduleService.getAllSchedules()

    expect(schedules.length).toBe(1)
  })

  it('should get schedule by id', async () => {
    const created: any = await scheduleService.createSchedule(mockSchedule)

    const found = await scheduleService.getScheduleById(created._id.toString())

    expect(found).toBeDefined()
    expect(found?.semesterNo).toBe(1)
  })

  it('should update schedule', async () => {
    const created: any = await scheduleService.createSchedule(mockSchedule)

    const updated = await scheduleService.updateSchedule(
      created._id.toString(),
      { semesterTitle: 'Spring' },
    )

    expect(updated).toBeDefined()
    expect(updated?.semesterTitle).toBe('Spring')
  })

  it('should delete schedule', async () => {
    const created: any = await scheduleService.createSchedule(mockSchedule)

    await scheduleService.deleteSchedule(created._id.toString())

    const found = await scheduleService.getScheduleById(created._id.toString())

    expect(found).toBeNull()
  })
})
