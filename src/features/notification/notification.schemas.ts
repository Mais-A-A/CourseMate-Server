import { z } from 'zod'

export const NOTIFICATION_TYPES = [
  'info',
  'success',
  'warning',
  'error',
  'deadline',
  'registration',
  'schedule',
  'academic',
  'reminder',
  'system',
] as const

export const notificationSchema = z.object({
  userId: z.string(),
  type: z.enum(NOTIFICATION_TYPES),
  message: z.string().max(255),
  isRead: z.boolean().default(false),
})
export type Notification = z.infer<typeof notificationSchema>
