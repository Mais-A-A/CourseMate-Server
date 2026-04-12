import { z } from 'zod'

export const ChatSchema = z.object({
  message: z.string().min(1).max(1000),
  sessionId: z.string().min(1),
})
