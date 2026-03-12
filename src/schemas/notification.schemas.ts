import { z } from 'zod'

export const notificationSchema = z.object({
  userId: z.string(),
  type: z.string().max(100),
  message: z.string().max(255),
  isRead: z.boolean().default(false),
})
export type Notification = z.infer<typeof notificationSchema>
