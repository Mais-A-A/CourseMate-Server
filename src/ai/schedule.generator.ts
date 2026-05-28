import { geminiModel } from '../config/gemini.js'
import { connectDatabase } from '../config/db.js'
import { User } from '../models/user.model.js'
import AcademicPlan from '../models/academicPlan.model.js'
import { CourseSection } from '../models/courseSection.model.js'
import { Schedule } from '../models/schedule.model.js'
import { AcademicWarning } from '../models/academicWarning.model.js'
import { AcademicRule } from '../models/academicRule.model.js'
import { type AcademicPlan as AcademicPlanType } from '../schemas/academicPlan.schema.js'
import { type CourseSection as CourseSectionType } from '../schemas/courseSection.schema.js'
import {
  extractCoursesFromAcademicPlan,
  classifyCourseByElegibility,
} from './context.fetcher.js'

export type GenerateScheduleParams = {
  userId: string
  acdYear: number
  semesterNo: number
  preferences?: string | undefined
}

export type ScheduledSection = {
  courseNo: number
  courseName: string
  sectionNo: number
  creditHours: number
  secTime: string | null
  roomName: string | null
  buildingName: string | null
  supervisorName: string | null
  capacity: number | null
  enrolled: number | null
  isOpen: boolean
  packageCaption: string | null
  reason: string
}

export type GeneratedSchedule = {
  studentName: string
  acdYear: number
  semesterNo: number
  totalCreditHours: number
  sections: ScheduledSection[]
  reasoning: string
  warnings: string[]
}

const SCHEDULE_RELEVANT_RULE_TYPES = new Set([
  'academic_load',
  'academic_warning',
  'graduation',
  'course_repetition',
  'substitute_course',
])

function parseModelResponseContent(content: unknown): string {
  if (typeof content === 'string') return content

  if (Array.isArray(content)) {
    return (
      content
        .map((part) => {
          if (typeof part === 'string') return part
          if (
            typeof part === 'object' &&
            part !== null &&
            'text' in part &&
            typeof (part as { text?: unknown }).text === 'string'
          ) {
            return (part as { text: string }).text
          }
          return ''
        })
        .join('')
        .trim() || 'I could not generate a response.'
    )
  }

  return 'I could not generate a response.'
}

type ParsedTime = {
  startMinutes: number
  endMinutes: number
  days: string[]
}

function parseSecTime(secTime: string | null | undefined): ParsedTime | null {
  if (!secTime) return null
  const match = secTime
    .trim()
    .match(/^(\d{2}:\d{2})_(\d{2}:\d{2})\s*\(([^)]+)\)/)
  if (!match || !match[1] || !match[2] || !match[3]) return null
  const toMinutes = (t: string) => {
    const parts = t.split(':')
    return (Number(parts[0]) || 0) * 60 + (Number(parts[1]) || 0)
  }
  return {
    startMinutes: toMinutes(match[1]),
    endMinutes: toMinutes(match[2]),
    days: match[3].split(',').map((d) => d.trim()),
  }
}

function hasTimeConflict(a: ParsedTime, b: ParsedTime): boolean {
  const sharedDay = a.days.some((d) => b.days.includes(d))
  if (!sharedDay) return false
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes
}

function resolveConflicts(
  sections: ScheduledSection[],
  sectionTimeMap: Map<string, string | null>,
  failedCourseNos: Set<number>,
  courseGroupMap: Map<number, string>,
): { sections: ScheduledSection[]; conflictWarnings: string[] } {
  const priority = (s: ScheduledSection) => {
    if (failedCourseNos.has(s.courseNo)) return 0
    const group = courseGroupMap.get(s.courseNo) ?? ''
    if (group.includes('اختياري') || group.includes('حرة')) return 2
    return 1
  }

  const sorted = [...sections].sort((a, b) => priority(a) - priority(b))
  const accepted: ScheduledSection[] = []
  const conflictWarnings: string[] = []
  const acceptedTimes: Array<{ parsed: ParsedTime; name: string }> = []

  for (const section of sorted) {
    const key = `${section.courseNo}-${section.sectionNo}`
    const parsed = parseSecTime(sectionTimeMap.get(key))

    if (!parsed) {
      accepted.push(section)
      continue
    }

    const conflictWith = acceptedTimes.find((t) =>
      hasTimeConflict(t.parsed, parsed),
    )
    if (conflictWith) {
      conflictWarnings.push(
        `تم حذف "${section.courseName}" (شعبة ${section.sectionNo}) بسبب تعارض في الوقت مع "${conflictWith.name}"`,
      )
    } else {
      accepted.push(section)
      acceptedTimes.push({ parsed, name: section.courseName })
    }
  }

  return { sections: accepted, conflictWarnings }
}

function extractJSON(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced?.[1]) return fenced[1].trim()
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1)
  return raw.trim()
}

async function fetchEligibleSections(
  eligibleCourseNos: number[],
  acdYear: number,
  semesterNo: number,
): Promise<CourseSectionType[]> {
  if (eligibleCourseNos.length === 0) return []

  const uniqueCourseNos = [...new Set(eligibleCourseNos)]

  const sections = (await CourseSection.find({
    courseNo: { $in: uniqueCourseNos },
    acdYear,
    semesterNo,
    isOpen: true,
  } as any).lean()) as unknown as CourseSectionType[]

  const seen = new Set<string>()
  const deduplicated = sections.filter((s) => {
    const key = `${String(s.courseNo)}-${String(s.sectionNo)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  console.log(
    `[Sections] DB raw: ${sections.length} → after dedup: ${deduplicated.length}`,
  )
  return deduplicated
}

function buildSchedulePrompt(params: {
  studentName: string
  gpa: number | string
  academicWarnings: string
  academicRules: string
  completedHours: number
  totalPlanHours: number
  isExpectedToGraduate: boolean
  eligibleSections: CourseSectionType[]
  courseGroupMap: Map<number, string>
  coursePlanMap: Map<number, { year: number | null; sem: number | null }>
  failedCourseNos: Set<number>
  scheduleHistory: string
  performanceSummary: string
  preferences: string
  acdYear: number
  semesterNo: number
}): string {
  const {
    studentName,
    gpa,
    academicWarnings,
    academicRules,
    completedHours,
    totalPlanHours,
    isExpectedToGraduate,
    eligibleSections,
    courseGroupMap,
    coursePlanMap,
    failedCourseNos,
    scheduleHistory,
    performanceSummary,
    preferences,
    acdYear,
    semesterNo,
  } = params

  const remainingHours =
    totalPlanHours > 0 ? Math.max(0, totalPlanHours - completedHours) : null

  const yearLevel =
    completedHours <= 33
      ? 'First Year (≤33 hrs completed)'
      : completedHours <= 67
        ? 'Second Year (34–67 hrs)'
        : completedHours <= 101
          ? 'Third Year (68–101 hrs)'
          : completedHours <= 135
            ? 'Fourth Year (102–135 hrs)'
            : 'Fifth Year (136+ hrs)'

  const sectionsText = eligibleSections
    .map((s) => {
      const priorityTag = failedCourseNos.has(s.courseNo)
        ? '[PRIORITY - student previously failed this course] '
        : ''
      const groupName = courseGroupMap.get(s.courseNo) ?? ''
      const groupTag = groupName ? ` | group: ${groupName}` : ''
      const plan = coursePlanMap.get(s.courseNo)
      const planTag =
        plan?.year != null
          ? ` | plan_year: ${plan.year}${plan.sem != null ? `, plan_sem: ${plan.sem}` : ''}`
          : ''
      return `- ${priorityTag}courseNo: ${s.courseNo} | name: ${s.courseName} | section: ${s.sectionNo} | credits: ${s.courseCredietHrs}${groupTag}${planTag} | time: ${s.secTime ?? 'N/A'} | room: ${s.roomName ?? 'N/A'} | supervisor: ${s.supervisorName ?? 'N/A'} | capacity: ${s.capacity ?? 'N/A'} | enrolled: ${s.counter ?? 'N/A'} | package: ${s.packageCaption ?? 'N/A'}`
    })
    .join('\n')

  const graduationNote =
    isExpectedToGraduate && remainingHours !== null
      ? `⚠️ GRADUATION SEMESTER + HARD LIMIT: This student is "متوقع تخرجه" (expected to graduate). Completed ${completedHours} of ${totalPlanHours} hours — exactly ${remainingHours} credit hours remain. Total recommended creditHours MUST NOT exceed ${remainingHours}. Treat this as a final-semester student.`
      : isExpectedToGraduate
        ? `⚠️ GRADUATION SEMESTER: This student is officially marked as "متوقع تخرجه" (expected to graduate this semester). They have completed ${completedHours} credit hours. The available sections below represent their remaining courses. Do NOT recommend more hours than what is actually listed as available. Treat this as a final-semester student.`
        : remainingHours !== null && remainingHours <= 21
          ? `⚠️ NOTE: This student has only ${remainingHours} credit hours remaining to graduate. Do NOT recommend more than ${remainingHours} credit hours total.`
          : null

  const preferencesText =
    preferences?.trim() && preferences.trim().toLowerCase() !== 'string'
      ? preferences.trim()
      : 'No specific preferences provided.'

  return `
You are an academic schedule advisor for Palestine Polytechnic University.
Your task is to generate an optimal semester schedule for the student below.
${graduationNote ? `\n${graduationNote}\n` : ''}
## Student Information
- Name: ${studentName}
- GPA: ${gpa}
- Year Level: ${yearLevel}
- Completed Credit Hours: ${completedHours}${remainingHours !== null ? ` / ${totalPlanHours} (${remainingHours} hours remaining to graduate)` : ''}
- Academic Status: ${isExpectedToGraduate ? 'متوقع تخرجه (FINAL SEMESTER)' : 'منتظم'}
- Academic Year for Schedule: ${acdYear}, Semester: ${semesterNo}

## Academic Performance Summary
${performanceSummary}

## Semester History (most recent first)
${scheduleHistory || 'No history available.'}

## Academic Warnings
${academicWarnings || 'None'}

## Academic Rules
${academicRules || 'None'}

## Student Preferences
${preferencesText}

## Available Course Sections (eligible for this student, open this semester)
${sectionsText || 'No sections available.'}

## Instructions
1. ${isExpectedToGraduate && remainingHours !== null ? `FINAL SEMESTER HARD LIMIT = ${remainingHours} hours. Total creditHours MUST equal exactly ${remainingHours}. Do NOT add extra courses beyond what is needed.` : isExpectedToGraduate ? 'FINAL SEMESTER: Only recommend courses the student genuinely needs. Do not fill up to 18 hours just because GPA allows it. The available sections ARE the remaining courses — select thoughtfully.' : `HOUR LOAD DECISION: University policy allows 12–18 hrs/semester (max 15 if academically warned; up to 21 with dept. approval only if GPA ≥ 80%). Do NOT treat 18 as the default — it is the ceiling, not the target. Use the Academic Performance Summary above to guide your decision: 18 hours is appropriate only for students who passed ALL their registered hours last semester AND have a GPA ≥ 80% with a stable or improving trend. For everyone else, 12–16 hours is the right range — choose based on this student's actual track record, not the policy maximum. Always justify your hour choice explicitly in the reasoning field.`}
2. PRIORITY courses (marked [PRIORITY]) are ones the student previously failed — include them first.
3. Avoid time conflicts between sections.
4. NEVER include a section in the schedule if enrolled >= capacity (it is full). For important courses where ALL sections are full: add a brief warning in Arabic explaining the course is important but unavailable this semester, and recommend deferring it to next semester. Do NOT suggest manual enrollment or contacting a supervisor — that decision belongs to the student and their supervisor, not to you.
5. ${isExpectedToGraduate ? 'If the total recommended hours are less than 12, clearly state this is a near-graduation final semester and advise the student to confirm their plan with their academic supervisor.' : 'If total hours < 12 for a regular semester, advise the student to consult their supervisor.'}
6. Each section has a "plan_year" and "plan_sem" field indicating when this course is recommended in the academic plan. Use these as a soft guide — prefer courses closer to the student's current year level. A 1st-year student should rarely take a plan_year 3 or 4 course. That said, use your judgment: if a course is a natural next step and the student is clearly ready, it is fine to include it. Also, do NOT add warnings about unavailable courses whose plan_year is more than 1 year ahead of the student's current year — they are simply not due yet and mentioning them creates unnecessary noise.
7. Think step by step. Verify the sum of creditHours before finalizing.
8. ${isExpectedToGraduate ? 'Each section has a "group" field showing its academic group. Courses from groups containing "اختياري" or "حرة" (elective) should only be included if the student has NOT yet satisfied that group\'s requirement. When in doubt between a mandatory course and an elective, always prefer the mandatory one.' : 'Follow the academic plan requirements.'}

## Notes on zero-credit courses
Zero-credit courses (creditHours = 0) are usually remedial/placement language courses (e.g. إنجليزي A2). Only include them if you are confident the student genuinely needs them based on their academic plan. If uncertain, exclude them — the student can register for them separately.

## Response Format
Respond ONLY with a valid JSON object. No explanation outside the JSON. No markdown backticks.
{
  "sections": [
    {
      "courseNo": <number>,
      "courseName": "<string>",
      "sectionNo": <number>,
      "creditHours": <number>,
      "secTime": "<string or null>",
      "supervisorName": "<string or null>",
      "capacity": <number or null>,
      "enrolled": <number or null>,
      "isOpen": true,
      "packageCaption": "<string or null>",
      "reason": "<one sentence in Arabic explaining why this specific course is recommended for this student>"
    }
  ],
  "totalCreditHours": <number>,
  "reasoning": "<overall summary in Arabic: student situation, total hours, and any important notes>",
  "warnings": ["<important notes for the student in Arabic>"]
}
`.trim()
}

export async function generateSchedule(
  params: GenerateScheduleParams,
): Promise<GeneratedSchedule> {
  const { userId, acdYear, semesterNo, preferences = '' } = params

  await connectDatabase()

  const user = await User.findOne({ email: `${userId}@ppu.edu` }).lean()
  if (!user) throw new Error('User not found')

  const academicPlan = (await AcademicPlan.findById(
    (user as any).student_data?.academic_plan ?? '',
  ).lean()) as AcademicPlanType | null
  if (!academicPlan) throw new Error('Academic plan not found')

  const { completedCourses, remainingCourses } =
    extractCoursesFromAcademicPlan(academicPlan)
  const { eligibleCourses } = classifyCourseByElegibility(remainingCourses)

  const eligibleCourseNos = [...eligibleCourses.values()].map(
    (c) => (c as any).courseNo as number,
  )
  const courseGroupMap = new Map<number, string>(
    [...eligibleCourses.values()].map((c) => [
      (c as any).courseNo as number,
      ((c as any).groupName as string) ?? '',
    ]),
  )
  const coursePlanMap = new Map<
    number,
    { year: number | null; sem: number | null }
  >(
    [...eligibleCourses.values()].map((c) => [
      (c as any).courseNo as number,
      {
        year: (c as any).courseYear ?? null,
        sem: (c as any).courseSemester ?? null,
      },
    ]),
  )

  const eligibleSections = await fetchEligibleSections(
    eligibleCourseNos,
    acdYear,
    semesterNo,
  )
  if (eligibleSections.length === 0) {
    throw new Error(
      'No open sections found for eligible courses in the specified semester.',
    )
  }

  const warningUserId = String((user as any)._id ?? userId)
  const [academicWarnings, academicRules, scheduleHistory] = await Promise.all([
    AcademicWarning.find({ user_id: warningUserId }).lean(),
    AcademicRule.find().lean(),
    Schedule.find({ studentNo: userId }).lean(),
  ])

  const academicWarningsText = academicWarnings
    .map(
      (w: any) =>
        `- ${w.caption}: ${w.value} (Resolved: ${w.is_resolved ? 'Yes' : 'No'})`,
    )
    .join('\n')

  const academicRulesText = academicRules
    .filter((r: any) => SCHEDULE_RELEVANT_RULE_TYPES.has(r.rule_type))
    .map((r: any) => `- ${r.rule_type}: ${r.description}`)
    .join('\n')

  const sortedHistory = (scheduleHistory as any[]).sort(
    (a, b) => b.academicYear - a.academicYear || b.semesterNo - a.semesterNo,
  )

  const scheduleHistoryText = sortedHistory
    .map(
      (s) =>
        `- ${s.academicYearTitle ?? s.academicYear} Sem ${s.semesterNo}: ${s.semesterHours ?? 'N/A'} hrs registered | Passed: ${s.passHours ?? 'N/A'} hrs | Semester Avg: ${s.semesterAverage ?? 'N/A'} | Cumulative: ${s.accumulativeAverage ?? 'N/A'} | Warning: ${s.academicWarning ?? 'None'}`,
    )
    .join('\n')

  const regularSemesters = sortedHistory.filter((s) => s.semesterNo !== 3)
  const lastSem = regularSemesters[0]
  const passRate =
    lastSem?.semesterHours > 0
      ? Math.round(((lastSem.passHours ?? 0) / lastSem.semesterHours) * 100)
      : null
  const passedAllLastSem =
    passRate !== null && lastSem.passHours >= lastSem.semesterHours

  const gpaTrend = (() => {
    const avgs = regularSemesters
      .map((s) => Number(s.accumulativeAverage))
      .filter((v) => !isNaN(v) && v > 0)
    if (avgs.length < 2) return 'insufficient data'
    const diff = (avgs[0] ?? 0) - (avgs[avgs.length - 1] ?? 0)
    if (diff > 2) return 'declining'
    if (diff < -2) return 'improving'
    return 'stable'
  })()

  const gpaValue = Number((user as any).student_data?.gpa ?? 0)
  const gpaBand =
    gpaValue >= 80
      ? 'جيد جداً–ممتاز (≥80%)'
      : gpaValue >= 70
        ? 'جيد (70–79%)'
        : gpaValue >= 65
          ? 'مقبول (65–69%)'
          : 'دون الحد المقبول (<65%)'

  const performanceSummary = [
    lastSem
      ? `- Last Semester Load: ${lastSem.semesterHours ?? 'N/A'} hrs registered, ${lastSem.passHours ?? 'N/A'} passed (${passRate !== null ? passRate + '%' : 'N/A'} pass rate)${passedAllLastSem ? ' — passed all registered hours' : ' — did NOT pass all registered hours'}`
      : null,
    `- GPA Band: ${gpaBand}`,
    `- GPA Trend: ${gpaTrend}`,
  ]
    .filter(Boolean)
    .join('\n')

  const completedHours = [...completedCourses.values()].reduce<number>(
    (sum, c) => sum + ((c as any).coursesCreditHours ?? 0),
    0,
  )
  const remainingFromPlan = [...remainingCourses.values()].reduce<number>(
    (sum, c) => sum + ((c as any).coursesCreditHours ?? 0),
    0,
  )
  const eligibleCoursesHours = [...eligibleCourses.values()].reduce<number>(
    (sum, c) => sum + ((c as any).coursesCreditHours ?? 0),
    0,
  )

  const isExpectedToGraduate = (
    sortedHistory[0]?.academicStatus ?? ''
  ).includes('تخرج')

  const totalPlanHoursFromGroups = (academicPlan.groups ?? []).reduce<number>(
    (sum, g) => sum + (Number(g.requiredHours) || 0),
    0,
  )
  const totalPlanHoursFromLevels = (academicPlan.levels ?? []).reduce<number>(
    (sum, l) => sum + (Number(l.requiredHours) || 0),
    0,
  )
  const derivedTotal = completedHours + remainingFromPlan

  const bestRemainingHours = (): number => {
    const candidates: number[] = []
    if (
      totalPlanHoursFromGroups > completedHours &&
      totalPlanHoursFromGroups < completedHours + 150
    )
      candidates.push(totalPlanHoursFromGroups - completedHours)
    if (
      totalPlanHoursFromLevels > completedHours &&
      totalPlanHoursFromLevels < completedHours + 150
    )
      candidates.push(totalPlanHoursFromLevels - completedHours)
    if (eligibleCoursesHours > 0) candidates.push(eligibleCoursesHours)
    return candidates.length > 0
      ? Math.min(...candidates)
      : eligibleCoursesHours
  }

  const totalPlanHours = isExpectedToGraduate
    ? completedHours + bestRemainingHours()
    : totalPlanHoursFromGroups > 0 &&
        Math.abs(totalPlanHoursFromGroups - derivedTotal) <= 20
      ? totalPlanHoursFromGroups
      : totalPlanHoursFromLevels > 0 &&
          Math.abs(totalPlanHoursFromLevels - derivedTotal) <= 20
        ? totalPlanHoursFromLevels
        : derivedTotal > 0
          ? derivedTotal
          : 0

  const failedCourseNos = new Set(
    [...eligibleCourses.values()]
      .filter((c) => (c as any).previouslyFailed)
      .map((c) => (c as any).courseNo as number),
  )

  const prompt = buildSchedulePrompt({
    studentName: (user as any).name ?? userId,
    gpa: (user as any).student_data?.gpa ?? 'N/A',
    academicWarnings: academicWarningsText,
    academicRules: academicRulesText,
    completedHours,
    totalPlanHours,
    isExpectedToGraduate,
    eligibleSections,
    courseGroupMap,
    coursePlanMap,
    failedCourseNos,
    scheduleHistory: scheduleHistoryText,
    performanceSummary,
    preferences,
    acdYear,
    semesterNo,
  })

  let aiMessage: Awaited<ReturnType<typeof geminiModel.invoke>>
  try {
    aiMessage = await geminiModel.invoke([{ role: 'user', content: prompt }])
    console.log('[Token Usage]', aiMessage.usage_metadata)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`AI model error: ${msg}`)
  }

  const rawResponse = parseModelResponseContent(aiMessage.content)

  let parsed: Omit<GeneratedSchedule, 'studentName' | 'acdYear' | 'semesterNo'>
  try {
    parsed = JSON.parse(extractJSON(rawResponse))
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${rawResponse}`)
  }

  const sectionDataMap = new Map<string, CourseSectionType>(
    eligibleSections.map((s) => [`${s.courseNo}-${s.sectionNo}`, s]),
  )
  const sectionTimeMap = new Map<string, string | null>(
    eligibleSections.map((s) => [
      `${s.courseNo}-${s.sectionNo}`,
      s.secTime ?? null,
    ]),
  )
  const eligibleSectionsLookup = new Set(sectionTimeMap.keys())

  const validatedSections = (parsed.sections ?? [])
    .filter((s: ScheduledSection) =>
      eligibleSectionsLookup.has(`${s.courseNo}-${s.sectionNo}`),
    )
    .map((s: ScheduledSection) => {
      const dbSection = sectionDataMap.get(`${s.courseNo}-${s.sectionNo}`)
      return {
        ...s,
        roomName: dbSection?.roomName ?? null,
        buildingName: dbSection?.buildingName ?? null,
      }
    })

  const { sections: finalSections, conflictWarnings } = resolveConflicts(
    validatedSections,
    sectionTimeMap,
    failedCourseNos,
    courseGroupMap,
  )

  const finalTotalHours = finalSections.reduce(
    (sum: number, s: ScheduledSection) => sum + (s.creditHours ?? 0),
    0,
  )

  const llmTotalHours = parsed.totalCreditHours ?? 0
  const reasoning =
    conflictWarnings.length > 0 && finalTotalHours !== llmTotalHours
      ? `${parsed.reasoning}\n\nتنبيه: تم تعديل الجدول تلقائياً بسبب تعارض في الأوقات، مما أدى إلى تخفيض الساعات من ${llmTotalHours} إلى ${finalTotalHours} ساعة. يُنصح بمراجعة المشرف الأكاديمي إذا كان هذا التغيير غير مناسب.`
      : parsed.reasoning

  return {
    studentName: (user as any).name ?? userId,
    acdYear,
    semesterNo,
    totalCreditHours: finalTotalHours,
    sections: finalSections,
    reasoning,
    warnings: [...(parsed.warnings ?? []), ...conflictWarnings],
  }
}
