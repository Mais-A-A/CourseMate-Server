import { model, Schema } from 'mongoose'

const completedCourseSchema = new Schema(
  {
    course_id: { type: String, required: true },
    course_name: { type: String, required: true },
    grade: { type: String, required: true },
  },
  { _id: false },
)

const studentDataSchema = new Schema(
  {
    completed_courses: {
      type: [completedCourseSchema],
      default: [],
    },
    gpa: {
      type: Number,
      default: 45.0,
      min: 45.0,
      max: 100.0,
    },
    /* I assumeed that the academic plan is a reference to an AcademicPlan document that defines the student's academic requirements and I also assumed that each student has only one academic plan, which is why it's a single reference rather than an array which may look diffrent form the Database design but it is more practical for the use case*/
    academic_plan: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicPlan',
      required: true,
    },
    notifications: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Notification',
      },
    ],
  },
  { _id: false },
)

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'admin', 'supervisor'],
      required: true,
      default: 'student',
    },

    student_data: {
      type: studentDataSchema,
      required: function (this: any) {
        return this.role === 'student'
      },
      validate: {
        validator: function (this: any, value: any) {
          if (this.role !== 'student' && value != null) {
            return false
          }
        },
        message: 'student_data must not be provided for non-student users.',
      },
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
)

export const User = model('User', userSchema)
export default User
