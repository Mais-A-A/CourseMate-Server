import { z } from 'zod'

export const ScheduleSchema = z.object({
  student_id: z.string(),
  semester_id: z.string(),
})
export type Schedule = z.infer<typeof ScheduleSchema>