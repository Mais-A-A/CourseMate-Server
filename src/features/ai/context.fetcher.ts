import { User } from '../user/user.model.js'
import { type User as UserSchemaType } from '../user/user.schemas.js'
import { AcademicWarning } from '../academic-warning/academicWarning.model.js'
import { type AcademicWarning as AcademicWarningType } from '../academic-warning/academicWarning.schema.js'
import { AcademicRule } from '../academic-rule/academicRule.model.js'
import { type AcademicRule as AcademicRuleType } from '../academic-rule/academicRule.schema.js'
import { CourseSection } from '../course-section/courseSection.model.js'
import { type CourseSection as CourseSectionType } from '../course-section/courseSection.schema.js'
import { Schedule } from '../schedule/schedule.model.js'
import { type Schedule as ScheduleType } from '../schedule/schedule.schema.js'
import AcademicPlan from '../academic-plan/academicPlan.model.js'
import { type AcademicPlan as AcademicPlanType } from '../academic-plan/academicPlan.schema.js'
import { connectDatabase } from '../../config/db.js'
import fs from 'node:fs'
import { AISchedule } from './aiSchedule.model.js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'

type UserWithId = UserSchemaType & { _id?: unknown }

async function fetchUser(userId: string): Promise<UserWithId | null> {
  return User.findOne({
    email: `${userId}@ppu.edu`,
  }).lean() as Promise<UserWithId | null>
}

async function fetchAcademicPlan(
  planId: string,
): Promise<AcademicPlanType | null> {
  return AcademicPlan.findById(
    planId,
  ).lean() as Promise<AcademicPlanType | null>
}

const FAIL_GRADES = new Set(['F', 'راسب', 'f', 'fail', 'FAIL', 'Fail'])

function courseHasPassed(
  lastGrade:
    | {
        gradeNGrade?: number | undefined
        gradeResultGrade?: string | undefined
        gradeCGrade?: string | undefined
        [key: string]: unknown
      }
    | undefined,
): boolean {
  if (!lastGrade) return false
  const result = lastGrade.gradeResultGrade
  const numeric = lastGrade.gradeNGrade
  const letter = lastGrade.gradeCGrade
  if (result && FAIL_GRADES.has(result)) return false
  if (letter && FAIL_GRADES.has(letter)) return false
  if (numeric !== undefined && numeric !== null && numeric > 0)
    return numeric >= 50
  if (result) return true
  if (letter) return true
  return false
}

export function extractCoursesFromAcademicPlan(academicPlan: AcademicPlanType) {
  const completedCourses = new Map<string, unknown>()
  const remainingCourses = new Map<string, unknown>()
  const passedAlternativeGroups = new Set<string>()

  academicPlan.groups.forEach((group) => {
    const requiredHours = group.requiredHours ?? 0

    const dbPassedHours =
      typeof group.passedHours === 'number' ? group.passedHours : -1
    const actualPassedHours =
      dbPassedHours > 0
        ? dbPassedHours
        : group.groupCoursList.reduce((sum, course) => {
            const lastGrade =
              course.courseGrades[course.courseGrades.length - 1]
            return courseHasPassed(lastGrade)
              ? sum + (course.coursesCreditHours ?? 0)
              : sum
          }, 0)

    const groupSatisfied =
      requiredHours > 0 && actualPassedHours >= requiredHours

    group.groupCoursList.forEach((course) => {
      const lastGrade = course.courseGrades[course.courseGrades.length - 1]
      const hasPassed = courseHasPassed(lastGrade)

      const courseInfo = {
        courseNo: course.courseNo,
        coursesArabicName: course.coursesArabicName,
        coursesCreditHours: course.coursesCreditHours,
        courseLevel: course.courseLevel,
        courseSemester: course.courseSemester,
        courseYear: course.courseYear,
        creditHours: course.coursesCreditHours,
        preCourse: course.preCourse,
        alternativeNo: course.alternativeNo,
        groupName: group.groupArabicName,
        grade: hasPassed
          ? (lastGrade?.gradeNGrade ?? lastGrade?.gradeResultGrade)
          : null,
        previouslyFailed: course.courseGrades.length > 0 && !hasPassed,
      }

      if (hasPassed) {
        completedCourses.set(course.coursesArabicName!, courseInfo)
        if (course.alternativeNo)
          passedAlternativeGroups.add(course.alternativeNo)
      } else if (!groupSatisfied) {
        remainingCourses.set(course.courseNo.toString(), courseInfo)
      }
    })
  })

  remainingCourses.forEach((courseInfo, key) => {
    const alt = (courseInfo as any).alternativeNo
    if (alt && passedAlternativeGroups.has(alt)) {
      remainingCourses.delete(key)
    }
  })

  return { completedCourses, remainingCourses }
}

export function classifyCourseByElegibility(
  remainingCourses: Map<string, unknown>,
) {
  const eligibleCourses = new Map<string, unknown>()
  const ineligibleCourses = new Map<string, unknown>()

  remainingCourses.forEach((courseInfo, courseKey) => {
    const preCourse = (courseInfo as any).preCourse as number[]

    const isEligible =
      !preCourse ||
      preCourse.length === 0 ||
      preCourse.every((pre) => !remainingCourses.has(String(pre)))

    if (isEligible) {
      eligibleCourses.set(courseKey, courseInfo)
    } else {
      ineligibleCourses.set(courseKey, courseInfo)
    }
  })

  return { eligibleCourses, ineligibleCourses }
}

const fetchSchedule = async (userId: string): Promise<ScheduleType[]> => {
  const schedules = await Schedule.find({
    studentNo: userId,
  }).lean()
  return schedules as unknown as ScheduleType[]
}

const fetchAcademicWarnings = async (
  userId: string,
): Promise<AcademicWarningType[]> => {
  const academicWarnings = (await AcademicWarning.find({
    user_id: userId,
  }).lean()) as unknown as AcademicWarningType[]
  if (!academicWarnings) {
    return []
  }
  return academicWarnings
}
function fetchAcademicRules(): Promise<AcademicRuleType[]> {
  return AcademicRule.find().lean() as Promise<AcademicRuleType[]>
}
/*
To be discussed: whether to fetch all course sections or only the ones relevant to the student (e.g., based on their major or completed courses). For now, we will fetch all sections for the IT and CS college.
function fetchCourseSections(
  collegeName = 'تكنولوجيا المعلومات وهندسة الحاسوب',
): Promise<CourseSectionType[]> {
  return CourseSection.find({
    collageArabicName: collegeName,
  }).lean() as Promise<CourseSectionType[]>
}
*/
export async function fetchContext(userId: string) {
  await connectDatabase()
  const user = await fetchUser(userId)
  if (!user) {
    throw new Error('User not found')
  }
  const academicPlan = await fetchAcademicPlan(
    user.student_data?.academic_plan ?? '',
  )
  if (!academicPlan) {
    throw new Error('Academic plan not found')
  }
  const { completedCourses, remainingCourses } =
    extractCoursesFromAcademicPlan(academicPlan)
  const { eligibleCourses, ineligibleCourses } =
    classifyCourseByElegibility(remainingCourses)

  const schedule = await fetchSchedule(userId)
  const warningUserId =
    user._id !== undefined && user._id !== null ? String(user._id) : userId
  const academicWarnings = await fetchAcademicWarnings(warningUserId)

  const completedCoursesText = [...completedCourses.entries()]
    .map(([courseName, courseInfo]) => {
      const c = courseInfo as any
      const sem = c.courseSemester != null ? `Sem ${c.courseSemester}` : null
      const yr = c.courseYear != null ? `Year ${c.courseYear}` : null
      const when = [yr, sem].filter(Boolean).join(', ')
      return `- ${courseName} (Grade: ${c.grade ?? 'N/A'}${when ? `, ${when}` : ''})`
    })
    .join('\n')

  const eligibleCoursesText = [...eligibleCourses.entries()]
    .map(([, courseInfo]) => {
      const c = courseInfo as any
      const sem = c.courseSemester != null ? `Sem ${c.courseSemester}` : null
      const yr = c.courseYear != null ? `Year ${c.courseYear}` : null
      const when = [yr, sem].filter(Boolean).join(', ')
      const failed = c.previouslyFailed ? 'Previously failed' : ''
      return `- ${c.coursesArabicName ?? c.courseNo}${when ? ` (${when})` : ''}${failed}`
    })
    .join('\n')

  const ineligibleCoursesText = [...ineligibleCourses.entries()]
    .map(([, courseInfo]) => {
      const c = courseInfo as any
      const sem = c.courseSemester != null ? `Sem ${c.courseSemester}` : null
      const yr = c.courseYear != null ? `Year ${c.courseYear}` : null
      const when = [yr, sem].filter(Boolean).join(', ')
      return `- ${c.coursesArabicName ?? c.courseNo}${when ? ` (${when})` : ''}`
    })
    .join('\n')

  const scheduleText = schedule
    .map(
      (s) =>
        `- Academic Year: ${s.academicYear} | ${s.academicYearTitle ?? 'N/A'} | Semester: ${s.semesterNo} (${s.semesterTitle ?? 'N/A'}) | Hours: ${s.semesterHours ?? 'N/A'} | Passed: ${s.passHours ?? 'N/A'} | Semester Avg: ${s.semesterAverage ?? 'N/A'} | Major Avg: ${s.majorAverage ?? 'N/A'} | Cumulative: ${s.accumulativeAverage ?? 'N/A'} | Warning: ${s.academicWarning ?? 'N/A'} | Status: ${s.academicStatus ?? 'N/A'}`,
    )
    .join('\n')

  const academicWarningsText = academicWarnings
    .map(
      (w) =>
        `- ${w.caption}: ${w.value} (Type: ${w.warning_type ?? 'N/A'}, Resolved: ${w.is_resolved ? 'Yes' : 'No'})`,
    )
    .join('\n')

  const academicRulesText = await fetchAcademicRules().then((rules) =>
    rules.map((r) => `- ${r.rule_type}: ${r.description}`).join('\n'),
  )
  /*
  const courseSections = await fetchCourseSections()

  const courseSectionsText = courseSections
    .map(
      (cs) =>
        `- ${cs.courseName} (Course No: ${cs.courseNo}, Section: ${cs.sectionNo}, Time: ${cs.secTime ?? 'N/A'}, Room: ${cs.roomName ?? 'N/A'}, Supervisor: ${cs.supervisorName ?? 'N/A'}, Capacity: ${cs.capacity ?? 'N/A'}, Enrolled: ${cs.counter ?? 'N/A'}, Open: ${cs.isOpen ? 'Yes' : 'No'})`,
    )
    .join('\n')

    */
  const aiSchedule = await AISchedule.findOne({
    studentNo: userId,
  }).lean()

  const aiScheduleText = aiSchedule
    ? `- Academic Year: ${aiSchedule.acdYear} | Semester: ${aiSchedule.semesterNo} | Total Credit Hours: ${aiSchedule.totalCreditHours} | Status: ${aiSchedule.status}\n  Sections:\n${aiSchedule.sections
        .map(
          (sec) =>
            `    - ${sec.courseName} (Course No: ${sec.courseNo}, Section: ${sec.sectionNo}, Credit Hours: ${sec.creditHours}, Time: ${sec.secTime ?? 'N/A'}, Room: ${sec.roomName ?? 'N/A'}, Building: ${sec.buildingName ?? 'N/A'}, Supervisor: ${sec.supervisorName ?? 'N/A'}, Capacity: ${sec.capacity ?? 'N/A'}, Enrolled: ${sec.enrolled ?? 'N/A'}, Open: ${sec.isOpen ? 'Yes' : 'No'}, Package: ${sec.packageCaption ?? 'N/A'}, Reason: ${sec.reason || 'None'})`,
        )
        .join('\n')}`
    : 'None'

  const levelsText = (academicPlan.levels ?? [])
    .map((level) => {
      const header = `### ${level.groupArabicName ?? `Level ${level.id}`}${level.requiredHours != null ? ` (${level.requiredHours} hrs)` : ''}`
      const courses = (level.groupCoursList ?? [])
        .map((c) => {
          const grade = c.courseGrades?.length
            ? ` | Grade: ${c.courseGrades[c.courseGrades.length - 1]?.gradeCGrade ?? 'N/A'}`
            : ''
          return `  - ${c.coursesArabicName} (No: ${c.courseNo}, ${c.coursesCreditHours} hrs${grade})`
        })
        .join('\n')
      return `${header}\n${courses}`
    })
    .join('\n\n')

  return `
Student Profile:

## Main Information

- Name: ${user.name}
- Email: ${user.email}
- GPA: ${user.student_data?.gpa ?? 'N/A'}
- Supervisor: ${user.student_data?.supervisor?.supervisorArabicName ?? 'N/A'}
- Supervisor Email: ${user.student_data?.supervisor?.supervisorEmail ?? 'N/A'}

## Academic Plan

- Academic Plan Year: ${academicPlan.planYear ?? 'N/A'}
- Academic Plan for major: ${academicPlan.majorArabicName ?? 'N/A'}

## Completed Courses

${completedCoursesText || 'None'}

## Eligible Courses for Next Semester

${eligibleCoursesText || 'None'}

## Ineligible Courses for Next Semester

${ineligibleCoursesText || 'None'}

## Course Distribution by Semester (توزيع المساقات على الفصول)

${levelsText || 'None'}

## Schedule

${scheduleText || 'None'}

## Academic Warnings

${academicWarningsText || 'None'}

## Academic Rules

${academicRulesText || 'None'}

## AI-Generated Schedule

${aiScheduleText || 'None'}

`.trim()
}

export async function dumpContextToFile(
  userId: string,
  outputPath = `context_${userId}.txt`,
): Promise<string> {
  const context = await fetchContext(userId)
  const resolvedPath = path.resolve(outputPath)
  await fs.promises.writeFile(resolvedPath, context, 'utf8')
  return resolvedPath
}

const isExecutedDirectly =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])

if (isExecutedDirectly) {
  const userId = process.argv[2]
  const outputPath = process.argv[3]

  if (!userId) {
    console.error(
      'Usage: node dist/src/ai/context.fetcher.js <userId> [outputFilePath]',
    )
    process.exit(1)
  }

  dumpContextToFile(userId, outputPath)
    .then(async (savedPath) => {
      console.log(`Context written to: ${savedPath}`)
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect()
      }
    })
    .catch(async (error) => {
      console.error('Error dumping context:', error)
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect()
      }
      process.exit(1)
    })
}

export default fetchContext
