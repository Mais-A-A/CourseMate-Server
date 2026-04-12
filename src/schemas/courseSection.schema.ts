import { z } from 'zod'

export const CourseSectionSchema = z.object({
  acdYear: z.number(),
  semesterNo: z.number(),
  courseNo: z.number(),
  courseName: z.string(),
  courseCredietHrs: z.number(),
  sectionNo: z.number(),
  labSectionNo: z.number().optional().default(-1),
  roomName: z.string().optional(),
  buildingName: z.string().optional(),
  supervisorName: z.string().optional(),
  capacity: z.number().optional(),
  counter: z.number().optional().default(0),
  majorNo: z.number().optional(),
  isOpen: z.boolean().optional().default(true),
  packageCaption: z.string().optional(),
  secTime: z.string().optional(),
  collageArabicName: z.string().optional(),
  majorArabicName: z.string().optional(),
  lSectionNo: z.string().optional().default(''),
})

export type CourseSection = z.infer<typeof CourseSectionSchema>
