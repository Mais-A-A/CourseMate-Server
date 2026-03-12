import { Schema, model } from 'mongoose'

const AIRecomendationSchema = new Schema(
  {
    student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    course_id: {type: Schema.Types.ObjectId, ref: 'Course', required: true},
    reason: { type: String},
    confidenceScore: {type: Number, default: 0.0}
  },
  {
    timestamps: {
      createdAt: 'issued_at',
      updatedAt: 'updated_at',
    },
  },
)

const AIRecomendation = model('AIRecomendation', AIRecomendationSchema)

export default AIRecomendation