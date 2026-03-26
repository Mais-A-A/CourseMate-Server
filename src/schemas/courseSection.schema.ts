import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const CourseSectionSchema = z.object({
  course_id: z.string(),
  semester_id: z.string(),
  instructor: z.string(),
  class_days: z.enum(['Sat','Sun','Mon','Tue','Wed','Thu']),
  start_time: z.string().regex(timeRegex, "start_time must be in HH:mm format"),
  end_time: z.string().regex(timeRegex, "end_time must be in HH:mm format"),
  classroom: z.string(),
  capacity: z.number(),
  available_seats: z.number()
})
.superRefine((data, ctx) => {
  const [startHour, startMin] = data.start_time.split(':').map(Number);
  const [endHour, endMin] = data.end_time.split(':').map(Number);

  const startTotal = (startHour || 0) * 60 + (startMin || 0);
  const endTotal = (endHour || 0) * 60 + (endMin || 0);

  if (endTotal <= startTotal) {
    ctx.addIssue({
      code: 'custom',
      path: ['end_time'],
      message: 'end_time must be after start_time'
    });
  }
});

export type CourseSection = z.infer<typeof CourseSectionSchema>