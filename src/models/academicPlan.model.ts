import { Schema, model } from 'mongoose'

const courseInGroupSchema = new Schema(
  {
    courseNo: { type: Number, required: true },
    coursesArabicName: { type: String },
    coursesCreditHours: { type: Number },
    courseLevel: { type: Number },
    courseOrder: { type: Number },
    courseSemester: { type: Number, default: null },
    courseYear: { type: Number, default: null },
    preCourse: [{ type: Number }],
    courseGrades: [{ type: String }],
  },
  { _id: false },
)

const planGroupSchema = new Schema(
  {
    groupArabicName: { type: String },
    groupEnglishName: { type: String },
    groupNo: { type: Number },
    calcMajorAvg: { type: Number },
    requiredHours: { type: Number },
    passedHours: { type: Number },
    medicineCourses: { type: Number },
    planYear: { type: Number },
    majorNo: { type: Number },
    groupCoursList: [courseInGroupSchema],
  },
  { _id: false },
)

const academicPlanSchema = new Schema(
  {
    majorNo: { type: Number, required: true },
    planYear: { type: Number, required: true },
    majorArabicName: { type: String },
    groups: [planGroupSchema],
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
