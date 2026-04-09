import { z } from 'zod'

export const AcademicPlanSchema = z.object({
  plan_name: z.string(),
  total_credits_required: z.number(),
  required_courses: z.array(z.string()),
})
export type AcademicPlan = z.infer<typeof AcademicPlanSchema>