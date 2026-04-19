import { z } from 'zod'

export const ScheduleSchema = z.object({
  student_id: z.string(),
  studentNo: z.number(),
  academicYear: z.number(),
  academicYearTitle: z.string().optional(),
  semesterNo: z.number(),
  semesterTitle: z.string().optional(),
  semesterHours: z.number().optional(),
  passHours: z.number().optional(),
  semesterAverage: z.number().optional(),
  majorAverage: z.number().optional(),
  accumulativeAverage: z.number().optional(),
  academicWarning: z.string().optional(),
  academicStatus: z.string().optional(),
})
export type Schedule = z.infer<typeof ScheduleSchema>
