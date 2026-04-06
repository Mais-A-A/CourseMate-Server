import { Schema, model } from 'mongoose'

const scheduleSchema = new Schema(
  {
    student_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    semester_id: { type: String, required: true },
    course_sections: [
      {
        course_section_id: {
          type: [Schema.Types.ObjectId],
          ref: 'CourseSection',
          required: true,
        },
      },
    ],
  },
  {
    timestamps: {
      createdAt: 'issued_at',
      updatedAt: 'updated_at',
    },
  },
)

export const Schedule = model('Schedule', scheduleSchema)

export default Schedule
