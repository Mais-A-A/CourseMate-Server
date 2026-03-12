import { Schema, model } from 'mongoose'

const courseSchema = new Schema(
  {
    course_code: { type: String, required: true },
    title: { type: String, required: true },
    credits: { type: Number, required: true },
    department_id: {type: Schema.Types.ObjectId, ref: 'Department', required: true },
    diffeculty_level: {
        type: String,
        enum: ["low", "moderate", "high"] // this needs more work(maybe numbers not enum), 
                                          // #TO-DO: Discuss that with Hasan
    }, 
    plan_id: {type: Schema.Types.ObjectId, ref: 'AcademicPlan', required: true },
    estimated: {type: Number, required: true}
  },
  {
    timestamps: {
      createdAt: 'issued_at',
      updatedAt: 'updated_at',
    },
  },
)

const Course = model('Course', courseSchema)

export default Course