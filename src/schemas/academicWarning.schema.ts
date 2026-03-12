import { z } from 'zod'

export const academicWarningSchema = z.object({
  user_id: z.string(),
  warning_type: z.string(),
  message: z.string(),
  is_resolved: z.boolean(),
  resolved_at: z.date().optional(),
})
export type AcademicWarning = z.infer<typeof academicWarningSchema>
