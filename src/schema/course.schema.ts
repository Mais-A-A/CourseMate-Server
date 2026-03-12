import { z } from 'zod'

export const CourseSchema = z.object({
  course_code: z.string(),
  title: z.string(),
  credits: z.number(),
  department_id: z.string(), 
  diffeculty_level: z.enum(['low', 'moderate', 'high']).default('moderate'),
  plan_id: z.string(),
  estimated: z.number().optional()
})
export type Course = z.infer<typeof CourseSchema>