import { Schema, model } from 'mongoose'

const academicWarningSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    caption: { type: String, required: true },
    value: { type: String, required: true },
    textColour: { type: String },
    orderNo: { type: Number },
    warning_type: { type: String },
    is_resolved: { type: Boolean, default: false },
    resolved_at: { type: Date },
  },
  {
    timestamps: {
      createdAt: 'issued_at',
      updatedAt: 'updated_at',
    },
  },
)

academicWarningSchema.index({ user_id: 1, is_resolved: 1 })

export const AcademicWarning = model('AcademicWarning', academicWarningSchema)

export default AcademicWarning
