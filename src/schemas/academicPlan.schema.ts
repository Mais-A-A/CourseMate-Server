import { z } from 'zod'

export const CourseGradeSchema = z.object({
  gradeNGrade: z.number().optional(),
  gradeResultGrade: z.string().optional(),
  courseTaken: z.number().optional(),
  gradeCGrade: z.string().optional(),
})

export const CourseInGroupSchema = z.object({
  courseNo: z.number(),
  coursesArabicName: z.string().optional(),
  coursesCreditHours: z.number().optional(),
  courseLevel: z.number().optional(),
  courseOrder: z.number().optional(),
  courseSemester: z.number().nullable().optional(),
  courseYear: z.number().nullable().optional(),
  preCourse: z.array(z.number()).optional().default([]),
  courseGrades: z.array(CourseGradeSchema).optional().default([]),
  alternativeNo: z.string().optional(),
})

export const PlanLevelSchema = z.object({
  id: z.number().optional(),
  groupArabicName: z.string().optional(),
  groupEnglishName: z.string().nullable().optional(),
  requiredHours: z.number().optional(),
  groupCoursList: z.array(CourseInGroupSchema).optional().default([]),
})

export const PlanGroupSchema = z.object({
  groupArabicName: z.string().optional(),
  groupEnglishName: z.string().optional(),
  groupNo: z.number().optional(),
  calcMajorAvg: z.boolean().optional(),
  requiredHours: z.number().optional(),
  passedHours: z.number().optional(),
  medicineCourses: z.boolean().optional(),
  planYear: z.number().optional(),
  majorNo: z.number().optional(),
  groupCoursList: z.array(CourseInGroupSchema).optional().default([]),
})

export const AcademicPlanSchema = z.object({
  majorNo: z.number(),
  planYear: z.number(),
  majorArabicName: z.string().optional(),
  groups: z.array(PlanGroupSchema).optional().default([]),
  levels: z.array(PlanLevelSchema).optional().default([]),
})

export type CourseGrade = z.infer<typeof CourseGradeSchema>
export type CourseInGroup = z.infer<typeof CourseInGroupSchema>
export type PlanGroup = z.infer<typeof PlanGroupSchema>
export type PlanLevel = z.infer<typeof PlanLevelSchema>
export type AcademicPlan = z.infer<typeof AcademicPlanSchema>
