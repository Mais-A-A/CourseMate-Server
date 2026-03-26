import { z } from 'zod'

export const completedCourseSchema = z.object({
  course_id: z.string(),
  course_name: z.string(),
  grade: z.string(),
})
export const studentDataSchema = z.object({
  completed_courses: z.array(completedCourseSchema).optional().default([]),
  gpa: z.number().min(45.0).max(100.0).optional(),
  academic_plan: z.string().optional(),
  notifications: z.array(z.string()).optional(),
})

export const userSchema = z
  .object({
    name: z.string(),
    email: z.string(),
    password: z.string(),
    role: z.enum(['student', 'admin', 'supervisor']).default('student'),
    student_data: studentDataSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'student' && !data.student_data) {
      ctx.addIssue({
        input: data.student_data,
        code: 'custom',
        path: ['student_data'],
        message: 'Student data is required for users with the student role.',
      })
    }
    if (data.role !== 'student' && data.student_data) {
      ctx.addIssue({
        input: data.student_data,
        code: 'custom',
        path: ['student_data'],
        message: 'Student data should not be provided for non-student roles.',
      })
    }
  })
export type CompletedCourse = z.infer<typeof completedCourseSchema>
export type StudentData = z.infer<typeof studentDataSchema>
export type User = z.infer<typeof userSchema>
