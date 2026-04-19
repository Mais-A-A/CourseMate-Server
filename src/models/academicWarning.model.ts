import { Schema, model } from 'mongoose'

const academicWarningSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    caption: { type: String, required: true },
    value: { type: String, required: true },
    textColour: { type: String },
    orderNo: { type: Number },
  },
  {
    timestamps: {
      createdAt: 'issued_at',
      updatedAt: 'updated_at',
    },
  },
)

export const AcademicWarning = model('AcademicWarning', academicWarningSchema)

export default AcademicWarning
