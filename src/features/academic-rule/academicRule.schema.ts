import { z } from 'zod'

export const academicRuleSchema = z.object({
  rule_type: z.string(),
  description: z.string(),
})
export type AcademicRule = z.infer<typeof academicRuleSchema>
