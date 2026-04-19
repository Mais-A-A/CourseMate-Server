import { z } from 'zod'

export const CourseSchema = z.object({
  courseNo: z.number(),
  coursesArabicName: z.string(),
  coursesCreditHours: z.number(),
  courseLevel: z.number().optional(),
  courseOrder: z.number().optional(),
  courseSemester: z.number().nullable().optional(),
  courseYear: z.number().nullable().optional(),
  preCourse: z.array(z.number()).optional().default([]),
  department_id: z.string().optional(),
})
export type Course = z.infer<typeof CourseSchema>
