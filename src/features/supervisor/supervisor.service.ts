import { User } from '../user/user.model.js'
import { Schedule } from '../schedule/schedule.model.js'
import { AcademicWarning } from '../academic-warning/academicWarning.model.js'
import { AISchedule } from '../ai/aiSchedule.model.js'
import {
  computeRisk,
  sortSemesters,
  type RiskResult,
  type SemesterRecord,
  type RiskLevel,
} from './risk.js'

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** "x@ppu.edu" and "x@ppu.edu.ps" are the same person. */
export function emailMatcher(email: string): RegExp {
  const local = email.trim().toLowerCase().split('@')[0]!
  return new RegExp(`^${escapeRegex(local)}@ppu\\.edu(\\.ps)?$`, 'i')
}

export type StudentSummary = {
  _id: string
  name: string
  email: string
  studentNo: number | null
  gpa: number | null
  supervisorName: string | null
  risk: Pick<RiskResult, 'score' | 'level' | 'trend'> & { topFactor: string | null; topFactorAr: string | null }
  activeWarnings: number
  latestSemester: {
    academicYear: number
    semesterNo: number
    semesterAverage: number | null
    passHours: number | null
    semesterHours: number | null
  } | null
}

type LeanUser = {
  _id: unknown
  name: string
  email: string
  student_data?: {
    studentNo?: number
    gpa?: number
    supervisor?: { supervisorArabicName?: string; supervisorEmail?: string }
  } | null
}

const toSemester = (s: any): SemesterRecord => ({
  academicYear: s.academicYear,
  semesterNo: s.semesterNo,
  semesterHours: s.semesterHours,
  passHours: s.passHours,
  semesterAverage: s.semesterAverage,
  accumulativeAverage: s.accumulativeAverage,
  academicWarning: s.academicWarning,
  academicStatus: s.academicStatus,
})

/** Loads semester records and unresolved warnings for many students in two queries. */
async function loadAcademicData(users: LeanUser[]) {
  const studentNos = users.map((u) => u.student_data?.studentNo).filter((n): n is number => typeof n === 'number')
  const ids = users.map((u) => String(u._id))
  const [schedules, warnings] = await Promise.all([
    Schedule.find({ studentNo: { $in: studentNos } }).lean(),
    AcademicWarning.find({ user_id: { $in: ids }, is_resolved: false }).lean(),
  ])
  const semestersByNo = new Map<number, SemesterRecord[]>()
  for (const s of schedules as any[]) {
    const list = semestersByNo.get(s.studentNo) ?? []
    list.push(toSemester(s))
    semestersByNo.set(s.studentNo, list)
  }
  const warningsById = new Map<string, { caption: string; value: string }[]>()
  for (const w of warnings as any[]) {
    const key = String(w.user_id)
    const list = warningsById.get(key) ?? []
    list.push({ caption: w.caption, value: w.value })
    warningsById.set(key, list)
  }
  return { semestersByNo, warningsById }
}

function summarize(
  user: LeanUser,
  data: Awaited<ReturnType<typeof loadAcademicData>>,
): StudentSummary & { _risk: RiskResult } {
  const studentNo = user.student_data?.studentNo ?? null
  const semesters = studentNo !== null ? (data.semestersByNo.get(studentNo) ?? []) : []
  const activeWarnings = data.warningsById.get(String(user._id)) ?? []
  const risk = computeRisk({ gpa: user.student_data?.gpa, semesters, activeWarnings })
  const latest = sortSemesters(semesters).at(-1)
  const top = [...risk.factors].sort((a, b) => b.points - a.points)[0]
  return {
    _id: String(user._id),
    name: user.name,
    email: user.email,
    studentNo,
    gpa: risk.gpa,
    supervisorName: user.student_data?.supervisor?.supervisorArabicName ?? null,
    risk: {
      score: risk.score,
      level: risk.level,
      trend: risk.trend,
      topFactor: top && top.points > 0 ? top.message : null,
      topFactorAr: top && top.points > 0 ? top.messageAr : null,
    },
    activeWarnings: activeWarnings.length,
    latestSemester: latest
      ? {
          academicYear: latest.academicYear,
          semesterNo: latest.semesterNo,
          semesterAverage: latest.semesterAverage ?? null,
          passHours: latest.passHours ?? null,
          semesterHours: latest.semesterHours ?? null,
        }
      : null,
    _risk: risk,
  }
}

type Scope = { supervisorEmail?: string | undefined }

function studentFilter(scope: Scope): any {
  const filter: any = { role: 'student' }
  if (scope.supervisorEmail) {
    filter['student_data.supervisor.supervisorEmail'] = emailMatcher(scope.supervisorEmail)
  }
  return filter
}

const LEVEL_ORDER: Record<RiskLevel, number> = { high: 3, medium: 2, low: 1, unknown: 0 }

export type ListOptions = Scope & {
  level?: RiskLevel | undefined
  q?: string | undefined
  sort?: 'risk' | 'gpa' | 'name' | undefined
  page?: number | undefined
  limit?: number | undefined
}

export async function listStudents(opts: ListOptions) {
  const filter = studentFilter(opts)
  const q = opts.q?.trim().slice(0, 60)
  if (q) {
    const re = new RegExp(escapeRegex(q), 'i')
    const or: Record<string, unknown>[] = [{ name: re }, { email: re }]
    if (/^\d+$/.test(q)) or.push({ 'student_data.studentNo': Number(q) })
    filter.$or = or
  }
  const users = (await User.find(filter).select('name email student_data').lean()) as unknown as LeanUser[]
  const data = await loadAcademicData(users)

  let rows = users.map((u) => summarize(u, data))
  if (opts.level) rows = rows.filter((r) => r.risk.level === opts.level)

  const sort = opts.sort ?? 'risk'
  rows.sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name, 'ar')
    if (sort === 'gpa') return (a.gpa ?? 999) - (b.gpa ?? 999)
    return (
      LEVEL_ORDER[b.risk.level] - LEVEL_ORDER[a.risk.level] ||
      b.risk.score - a.risk.score ||
      a.name.localeCompare(b.name, 'ar')
    )
  })

  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200)
  const page = Math.max(opts.page ?? 1, 1)
  const total = rows.length
  const items = rows.slice((page - 1) * limit, page * limit).map(({ _risk, ...rest }) => rest)
  return { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
}

export async function getOverview(scope: Scope) {
  const users = (await User.find(studentFilter(scope)).select('name email student_data').lean()) as unknown as LeanUser[]
  const data = await loadAcademicData(users)
  const rows = users.map((u) => summarize(u, data))

  const byLevel: Record<RiskLevel, number> = { high: 0, medium: 0, low: 0, unknown: 0 }
  const trend = { improving: 0, stable: 0, declining: 0, unknown: 0 }
  let gpaSum = 0
  let gpaCount = 0
  let withWarnings = 0
  for (const r of rows) {
    byLevel[r.risk.level]++
    trend[r.risk.trend]++
    if (r.gpa !== null) {
      gpaSum += r.gpa
      gpaCount++
    }
    if (r.activeWarnings > 0) withWarnings++
  }
  const needsAttention = rows
    .filter((r) => r.risk.level === 'high')
    .sort((a, b) => b.risk.score - a.risk.score)
    .slice(0, 5)
    .map(({ _risk, ...rest }) => rest)

  return {
    totalStudents: rows.length,
    byRiskLevel: byLevel,
    trend,
    averageGpa: gpaCount ? Math.round((gpaSum / gpaCount) * 10) / 10 : null,
    studentsWithActiveWarnings: withWarnings,
    needsAttention,
  }
}

/** Returns the student only if they are one of the requesting supervisor's own students. */
export async function findStudentForViewer(
  studentNo: number,
  viewer: { role: string; email: string },
): Promise<(LeanUser & Record<string, any>) | null> {
  const filter: any = {
    role: 'student',
    'student_data.studentNo': studentNo,
    'student_data.supervisor.supervisorEmail': emailMatcher(viewer.email),
  }
  return (await User.findOne(filter).select('-password').lean()) as any
}

export async function getStudentDetail(user: LeanUser & Record<string, any>) {
  const data = await loadAcademicData([user])
  const summary = summarize(user, data)
  const studentNo = user.student_data?.studentNo
  const [semesters, warnings, approved, pending] = await Promise.all([
    studentNo !== undefined ? Schedule.find({ studentNo }).lean() : Promise.resolve([]),
    AcademicWarning.find({ user_id: String(user._id) }).sort({ issued_at: -1 }).lean(),
    AISchedule.findOne({ studentNo: String(studentNo), status: 'approved' }).sort({ acdYear: -1, semesterNo: -1 }).lean(),
    AISchedule.exists({ studentNo: String(studentNo), status: 'pending' }),
  ])
  const { _risk, ...rest } = summary
  return {
    student: rest,
    risk: _risk,
    semesters: sortSemesters((semesters as any[]).map(toSemester)),
    warnings: (warnings as any[]).map((w) => ({
      _id: String(w._id),
      caption: w.caption,
      value: w.value,
      type: w.warning_type ?? null,
      isResolved: !!w.is_resolved,
      issuedAt: w.issued_at,
      resolvedAt: w.resolved_at ?? null,
    })),
    approvedSchedule: approved
      ? {
          acdYear: (approved as any).acdYear,
          semesterNo: (approved as any).semesterNo,
          totalCreditHours: (approved as any).totalCreditHours,
          sections: (approved as any).sections,
        }
      : null,
    hasPendingSchedule: !!pending,
    _risk,
    _activeWarnings: data.warningsById.get(String(user._id)) ?? [],
  }
}
