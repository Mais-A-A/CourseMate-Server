import { Schema, model } from 'mongoose'

const scheduleSchema = new Schema(
  {
    student_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentNo: { type: Number, required: true },
    academicYear: { type: Number, required: true },
    academicYearTitle: { type: String },
    semesterNo: { type: Number, required: true },
    semesterTitle: { type: String },
    semesterHours: { type: Number },
    passHours: { type: Number },
    semesterAverage: { type: Number },
    majorAverage: { type: Number },
    accumulativeAverage: { type: Number },
    academicWarning: { type: String },
    academicStatus: { type: String },
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
