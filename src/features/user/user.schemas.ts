import { z } from 'zod'

export const completedCourseSchema = z.object({
  courseNo: z.number(),
  courseArabicName: z.string().optional(),
  academicYear: z.number().optional(),
  semesterNo: z.number().optional(),
  creditHours: z.string().optional(),
  grade: z.string(),
  weight: z.string().optional().default(''),
  caption: z.string().optional().default(''),
})

export const supervisorSchema = z.object({
  supervisorNo: z.number().optional(),
  supervisorArabicName: z.string().optional(),
  supervisorEmail: z.string().email().optional(),
})

export const studentDataSchema = z.object({
  studentNo: z.number().optional(),
  completed_courses: z.array(completedCourseSchema).optional().default([]),
  gpa: z.number().min(45.0).max(100.0).optional(),
  academic_plan: z.string().optional(),
  supervisor: supervisorSchema.optional(),
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
export type Supervisor = z.infer<typeof supervisorSchema>
export type StudentData = z.infer<typeof studentDataSchema>
export type User = z.infer<typeof userSchema>
