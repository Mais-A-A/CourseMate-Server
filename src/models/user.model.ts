import { model, Schema } from 'mongoose'
import { no } from 'zod/locales'

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
    user_id: {
      type: String,
      required: true,
      unique: true,
    },
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
      validate: {
        validator: function (value: any) {
          if (this.role === 'student') {
            return value !== undefined
          }
          if (this.role !== 'student' && value !== undefined) {
            return false
          }
          return true
        },
        message:
          'Student data is required for users with the student role and should not be provided for non-student roles.',
      },
      default: undefined,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
)

export const UserModel = model('User', userSchema)
