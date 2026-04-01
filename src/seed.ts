import mongoose from 'mongoose'
import { connectDatabase } from './config/db.js'
import AcademicPlan from './models/academicPlan.model.js'
import Department from './models/department.model.js'
import Course from './models/course.model.js'
import CourseSection from './models/courseSection.model.js'
import User from './models/user.model.js'
import Notification from './models/notification.model.js'
import AcademicRule from './models/academicRule.model.js'
import AcademicWarning from './models/academicWarning.model.js'
import Schedule from './models/schedule.model.js'
import AIRecomendation from './models/AIRecomendation.model.js'

export const seed = async () => {
  await connectDatabase()

  const AcademicPlanModel = AcademicPlan as any
  const DepartmentModel = Department as any
  const CourseModel = Course as any
  const CourseSectionModel = CourseSection as any
  const UserModel = User as any
  const NotificationModel = Notification as any
  const AcademicRuleModel = AcademicRule as any
  const AcademicWarningModel = AcademicWarning as any
  const ScheduleModel = Schedule as any
  const AIRecomendationModel = AIRecomendation as any

  await Promise.all([
    ScheduleModel.deleteMany({}),
    AcademicWarningModel.deleteMany({}),
    NotificationModel.deleteMany({}),
    AIRecomendationModel.deleteMany({}),
    CourseSectionModel.deleteMany({}),
    CourseModel.deleteMany({}),
    DepartmentModel.deleteMany({}),
    UserModel.deleteMany({}),
    AcademicPlanModel.deleteMany({}),
    AcademicRuleModel.deleteMany({}),
  ])

  const plan = await AcademicPlanModel.create({
    plan_name: 'Computer Science 2026',
    total_credits_required: 132,
    required_courses: ['CS101', 'CS102', 'MATH101'],
  })

  const department = await DepartmentModel.create({
    department_name: 'Computer Science',
    dean_name: 'Dr. Sarah Noor',
  })

  const [course1, course2] = await CourseModel.create([
    {
      course_code: 'CS101',
      title: 'Introduction to Programming',
      credits: 3,
      department_id: department._id,
      diffeculty_level: 'low',
      plan_id: plan._id,
      estimated: 6,
    },
    {
      course_code: 'CS201',
      title: 'Data Structures',
      credits: 3,
      department_id: department._id,
      diffeculty_level: 'moderate',
      plan_id: plan._id,
      estimated: 8,
    },
  ])

  const section = await CourseSectionModel.create({
    course_id: course1._id,
    semester_id: '2026-spring',
    instructor: 'Dr. Ahmed Farouk',
    class_days: ['Sun', 'Tue'],
    start_time: '10:00',
    end_time: '11:30',
    classroom: 'B-203',
    capacity: 40,
    available_seats: 35,
  })

  const student = await UserModel.create({
    name: 'Hasan Mohammad Al-Saafin',
    email: 'hasan@gmail.com',
    password: 'pass1234',
    role: 'student',
    student_data: {
      completed_courses: [
        {
          course_id: 'MATH101',
          course_name: 'Calculus I',
          grade: 'B+',
        },
      ],
      gpa: 83.5,
      academic_plan: plan._id,
      notifications: [],
    },
  })

  const supervisor = await UserModel.create({
    name: 'Mona Ibrahim',
    email: 'supervisor@coursemate.dev',
    password: 'pass1234',
    role: 'supervisor',
  })

  await UserModel.create({
    name: 'Admin User',
    email: 'admin@coursemate.dev',
    password: 'pass1234',
    role: 'admin',
  })

  const notification = await NotificationModel.create({
    userId: student._id,
    type: 'academic',
    message: 'You have been enrolled in CS101 section B-203.',
    isRead: false,
  })

  await UserModel.updateOne(
    { _id: student._id },
    {
      $push: {
        'student_data.notifications': notification._id,
      },
    },
  )

  await AcademicRuleModel.create({
    rule_type: 'min_gpa',
    description: 'Students with GPA below 60 receive an academic warning.',
  })

  await AcademicWarningModel.create({
    user_id: student._id,
    warning_type: 'performance',
    message: 'Maintain GPA above 60 to avoid probation.',
    is_resolved: false,
  })

  await ScheduleModel.create({
    student_id: student._id,
    semester_id: '2026-spring',
    course_sections: [
      {
        course_section_id: [section._id],
      },
    ],
  })

  await AIRecomendationModel.create({
    student_id: student._id,
    supervisor_id: supervisor._id,
    courses: [course1._id, course2._id],
    reason: 'Balanced workload based on previous performance.',
    confidenceScore: 0.91,
  })

  console.log('Database seeded successfully')
}

seed()
  .then(() => {
    console.log('Seeding completed')
  })
  .catch((error) => {
    console.error('Seeding failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.connection.close()
  })
