import { Schema, model } from 'mongoose'

const AIRecomendationSchema = new Schema(
  {
    // I assumed that the student_id and supervisor_id are optional because there may be cases where the recommendation is generated for a student without a specific supervisor or for a supervisor without a specific student, and this flexibility allows for a wider range of use cases for the AI recommendation system.
    student_id: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    supervisor_id: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    // I've edited the courses field to be an array of ObjectIds that reference the Course model instead of a single ObjectId because a recommendation may involve multiple courses, and this change allows for more comprehensive recommendations that can include a list of relevant courses rather than just one.
    courses: { type: [Schema.Types.ObjectId], ref: 'Course', required: true },
    reason: { type: String },
    confidenceScore: { type: Number, default: 0.0 },
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
