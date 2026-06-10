import { Schema, model } from 'mongoose'

const scheduledSectionSchema = new Schema(
  {
    courseNo: { type: Number, required: true },
    courseName: { type: String, required: true },
    sectionNo: { type: Number, required: true },
    creditHours: { type: Number, required: true },
    secTime: { type: String, default: null },
    roomName: { type: String, default: null },
    buildingName: { type: String, default: null },
    supervisorName: { type: String, default: null },
    capacity: { type: Number, default: null },
    enrolled: { type: Number, default: null },
    isOpen: { type: Boolean, default: true },
    packageCaption: { type: String, default: null },
    reason: { type: String, default: '' },
  },
  { _id: false },
)

const aiScheduleSchema = new Schema(
  {
    studentNo: { type: String, required: true },
    acdYear: { type: Number, required: true },
    semesterNo: { type: Number, required: true },
    studentName: { type: String },
    totalCreditHours: { type: Number, required: true },
    sections: { type: [scheduledSectionSchema], required: true },
    reasoning: { type: String },
    warnings: { type: [String], default: [] },
    status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
  },
  { timestamps: true },
)

aiScheduleSchema.index({ studentNo: 1, createdAt: -1 })

export const AISchedule = model('AISchedule', aiScheduleSchema)
export default AISchedule
