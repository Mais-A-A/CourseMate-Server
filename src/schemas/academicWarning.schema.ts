import { z } from 'zod'

export const academicWarningSchema = z.object({
  user_id: z.string(),
  caption: z.string(),
  value: z.string(),
  textColour: z.string().optional(),
  orderNo: z.number().optional(),
})
export type AcademicWarning = z.infer<typeof academicWarningSchema>
