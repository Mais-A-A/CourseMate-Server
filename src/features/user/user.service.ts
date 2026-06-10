import { User } from './user.model.js'
import AcademicPlan from '../academic-plan/academicPlan.model.js'
import type { User as UserType } from './user.schemas.js'

const FAIL_GRADES = new Set(['F', 'راسب', 'f', 'fail', 'FAIL', 'Fail'])

async function enrichWithCourseHistory(user: any) {
  if (!user || user.role !== 'student' || !user.student_data?.academic_plan) {
    return user
  }

  const plan = (await AcademicPlan.findById(
    user.student_data.academic_plan,
  ).lean()) as any

  if (!plan) return user

  const completed_courses: object[] = []
  let completed_credit_hours = 0

  for (const group of plan.groups ?? []) {
    for (const course of group.groupCoursList ?? []) {
      if (!course.courseGrades?.length) continue

      for (const grade of course.courseGrades) {
        completed_courses.push({
          courseNo: course.courseNo,
          courseName: course.coursesArabicName ?? null,
          creditHours: course.coursesCreditHours ?? null,
          groupName: group.groupArabicName ?? null,
          numericGrade: grade.gradeNGrade ?? null,
          result: grade.gradeResultGrade ?? null,
          letterGrade: grade.gradeCGrade ?? null,
        })
      }

      const lastGrade = course.courseGrades[course.courseGrades.length - 1]

      const numeric = lastGrade?.gradeNGrade
      const result = lastGrade?.gradeResultGrade
      const letter = lastGrade?.gradeCGrade

      const passed =
        (result && !FAIL_GRADES.has(result)) ||
        (letter && !FAIL_GRADES.has(letter)) ||
        (numeric !== undefined && numeric !== null && numeric >= 50)

      if (passed) {
        completed_credit_hours += course.coursesCreditHours ?? 0
      }
    }
  }

  return {
    ...user,
    student_data: {
      ...user.student_data,
      completed_courses,
      completed_credit_hours,
    },
  }
}
class UserService {
  async createUser(userData: UserType) {
    const existingUser = await User.findOne({ email: userData.email })

    if (existingUser) {
      throw new Error('Email already exists')
    }

    const user = new User(userData)
    return await user.save()
  }

  async getAllUsers() {
    return await User.find().lean().select('-password')
  }

  async getUserByEmail(email: string) {
    const user = await User.findOne({ email }).select('-password').lean()
    return enrichWithCourseHistory(user)
  }

  async getUserBySupervisorEmail(supervisorEmail: string) {
    return await User.find({
      'student_data.supervisor.supervisorEmail': supervisorEmail,
    })
      .select('-password')
      .lean()
  }

  async getUserById(id: string) {
    const user = await User.findById(id).select('-password').lean()
    return enrichWithCourseHistory(user)
  }

  async updateUser(id: string, updateData: Partial<UserType>) {
    if (updateData.email) {
      const existingUser = await User.findOne({
        email: updateData.email,
        _id: { $ne: id },
      })

      if (existingUser) {
        throw new Error('Email already in use')
      }
    }

    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password')
  }

  async deleteUser(id: string) {
    return await User.findByIdAndDelete(id)
  }
}

export const userService = new UserService()
export default userService
