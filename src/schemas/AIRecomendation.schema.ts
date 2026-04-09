import { z } from 'zod'

export const AIRecomendationSchema = z.object({
  student_id: z.string().optional(),
  supervisor_id: z.string().optional(),
  courses: z.array(z.string()),
  reason: z.string().optional(),
  confidenceScore: z.number().optional(),
})
export type AIRecomendation = z.infer<typeof AIRecomendationSchema>