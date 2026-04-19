import { z } from 'zod'

export const CourseInGroupSchema = z.object({
  courseNo: z.number(),
  coursesArabicName: z.string().optional(),
  coursesCreditHours: z.number().optional(),
  courseLevel: z.number().optional(),
  courseOrder: z.number().optional(),
  courseSemester: z.number().nullable().optional(),
  courseYear: z.number().nullable().optional(),
  preCourse: z.array(z.number()).optional().default([]),
  courseGrades: z.array(z.string()).optional().default([]),
})

export const PlanGroupSchema = z.object({
  groupArabicName: z.string().optional(),
  groupEnglishName: z.string().optional(),
  groupNo: z.number().optional(),
  calcMajorAvg: z.number().optional(),
  requiredHours: z.number().optional(),
  passedHours: z.number().optional(),
  medicineCourses: z.number().optional(),
  planYear: z.number().optional(),
  majorNo: z.number().optional(),
  groupCoursList: z.array(CourseInGroupSchema).optional().default([]),
})

export const AcademicPlanSchema = z.object({
  majorNo: z.number(),
  planYear: z.number(),
  majorArabicName: z.string().optional(),
  groups: z.array(PlanGroupSchema).optional().default([]),
})

export type CourseInGroup = z.infer<typeof CourseInGroupSchema>
export type PlanGroup = z.infer<typeof PlanGroupSchema>
export type AcademicPlan = z.infer<typeof AcademicPlanSchema>
