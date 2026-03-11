import { Schema, model } from 'mongoose'

const academicWarningSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    warning_type: {
      type: String,
      required: true,
    },

    message: { type: String, required: true },

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

const AcademicWarning = model('AcademicWarning', academicWarningSchema)

export default AcademicWarning
