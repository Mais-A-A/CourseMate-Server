import { z } from 'zod'

export const ChatSchema = z.object({
  message: z.string().min(1).max(1000),
  sessionId: z.string().min(1),
})

export const GenerateScheduleSchema = z.object({
  acdYear: z.coerce.number().optional().default(2025),
  semesterNo: z.coerce.number().optional().default(2),
  preferences: z.string().max(500).optional(),
})

export const GenerateScheduleForStudentSchema = z.object({
  studentId: z.string().min(1),
  acdYear: z.coerce.number(),
  semesterNo: z.coerce.number(),
  preferences: z.string().max(500).optional(),
})