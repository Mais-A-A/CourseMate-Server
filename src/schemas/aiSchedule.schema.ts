import { z } from 'zod'

export const scheduledSectionSchema = z.object({
  courseNo: z.number(),
  courseName: z.string(),
  sectionNo: z.number(),
  creditHours: z.number(),
  secTime: z.string().nullable().optional(),
  roomName: z.string().nullable().optional(),
  buildingName: z.string().nullable().optional(),
  supervisorName: z.string().nullable().optional(),
  capacity: z.number().nullable().optional(),
  enrolled: z.number().nullable().optional(),
  isOpen: z.boolean().optional(),
  packageCaption: z.string().nullable().optional(),
  reason: z.string().optional(),
})

export const aiScheduleSchema = z.object({
  studentNo: z.string(),
  acdYear: z.number(),
  semesterNo: z.number(),
  studentName: z.string().optional(),
  totalCreditHours: z.number(),
  sections: z.array(scheduledSectionSchema),
  reasoning: z.string().optional(),
  warnings: z.array(z.string()).optional(),
  status: z.enum(['pending', 'approved']).default('pending'),
})

export type ScheduledSection = z.infer<typeof scheduledSectionSchema>
export type AISchedule = z.infer<typeof aiScheduleSchema>
