import { model, Schema } from 'mongoose'

const completedCourseSchema = new Schema(
  {
    courseNo: { type: Number, required: true },
    courseArabicName: { type: String },
    academicYear: { type: Number },
    semesterNo: { type: Number },
    creditHours: { type: String },
    grade: { type: String, required: true },
    weight: { type: String, default: '' },
    caption: { type: String, default: '' },
  },
  { _id: false },
)

const supervisorSchema = new Schema(
  {
    supervisorNo: { type: Number },
    supervisorArabicName: { type: String },
    supervisorEmail: { type: String },
  },
  { _id: false },
)

const studentDataSchema = new Schema(
  {
    studentNo: { type: Number },
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
    academic_plan: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicPlan',
      required: true,
    },
    supervisor: supervisorSchema,
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
          return true
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
