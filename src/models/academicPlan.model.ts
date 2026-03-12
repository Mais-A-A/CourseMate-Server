import { Schema, model } from 'mongoose'

const academicPlanSchema = new Schema(
  {
    plan_name: { type: String, required: true },
    total_credits_required: {type: Number, required: true },
  },
  {
    timestamps: {
      createdAt: 'issued_at',
      updatedAt: 'updated_at',
    },
  },
)

const AcademicPlan = model('AcademicPlan', academicPlanSchema)

export default AcademicPlan