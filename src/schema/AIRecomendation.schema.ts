import { z } from 'zod'

export const AIRecomendationSchema = z.object({
  student_id: z.string(),
  course_id: z.string(),
  reason: z.string().optional(),
  confidenceScore: z.number().optional()
})
export type AIRecomendation = z.infer<typeof AIRecomendationSchema>