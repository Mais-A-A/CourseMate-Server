import { Types } from 'mongoose'
import { User } from '../models/user.model.js'
import { AcademicWarning } from '../models/academicWarning.model.js'
import { AcademicRule } from '../models/academicRule.model.js'

export async function fetchUserContext(userId: string) {
  const warningFilter: Record<string, unknown> = {}
  let user
  try {
    const studentNo = Number(userId)
    user = await User.findOne({ 'student_data.studentNo': studentNo }).lean()

    if (user?._id) {
      warningFilter.user_id = user._id
    } else {
      console.warn(`[ContextFetcher] No user found for ID ${userId}`)
    }
  } catch (error) {
    console.error(
      `[AdvisorService] Error fetching user context for ${userId}:`,
      error,
    )
    return 'I could not retrieve your profile information.'
  }
  const [warnings, rules] = await Promise.all([
    AcademicWarning.find(warningFilter as any).lean(),
    AcademicRule.find().lean(),
  ])

  const completedCourses = user?.student_data?.completed_courses ?? []

  return `
## Student Profile
Name: ${user?.name ?? 'Unknown'}
GPA: ${user?.student_data?.gpa ?? 'N/A'}
Completed Courses: ${
    completedCourses
      .map((c: any) => c.courseArabicName || `Course ${c.courseNo}`)
      .join(', ') || 'None'
  }

## Academic Warnings (${warnings.length})
${warnings.map((w: any) => `- ${w.caption}: ${w.value}`).join('\n') || 'None'}

## Academic Rules
${rules.map((r: any) => `- ${r.rule_type}: ${r.description}`).join('\n') || 'None'}
  `.trim()
}
