import { Schema, model } from 'mongoose'

const courseSchema = new Schema(
  {
    courseNo: { type: Number, required: true },
    coursesArabicName: { type: String, required: true },
    coursesCreditHours: { type: Number, required: true },
    courseLevel: { type: Number },
    courseOrder: { type: Number },
    courseSemester: { type: Number, default: null },
    courseYear: { type: Number, default: null },
    preCourse: [{ type: Number }],
    department_id: { type: Schema.Types.ObjectId, ref: 'Department' },
  },
  {
    timestamps: {
      createdAt: 'issued_at',
      updatedAt: 'updated_at',
    },
  },
)

export const Course = model('Course', courseSchema)

export default Course
