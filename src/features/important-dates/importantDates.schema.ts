import { z } from 'zod'

export const importantDatesSchema = z.object({
  date_name: z.string().min(1, 'Date name is required'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  description: z.string().optional(),
  type: z.enum(['holiday', 'registration', 'deadline', 'event']),
})
export type ImportantDateType = z.infer<typeof importantDatesSchema>
