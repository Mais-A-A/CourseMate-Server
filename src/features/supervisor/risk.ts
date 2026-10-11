/**
 * Academic risk scoring. Deterministic and explainable: every point of the score comes from a named factor
 * with a human-readable reason, so supervisors can see exactly why a student is flagged.
 * Marks use PPU's 100-point scale. The thresholds below are assumptions: align them with the university's
 * academic rules (probation / warning limits) before relying on them.
 */

export const RISK_THRESHOLDS = {
  /** GPA under this: probation territory */
  probationGpa: 60,
  watchGpa: 65,
  comfortableGpa: 70,
  /** Drop in semester average between the last two semesters */
  sharpDrop: 5,
  drop: 2,
  lowSemesterAverage: 60,
  /** passHours / semesterHours of the latest semester */
  poorPassRatio: 0.5,
  weakPassRatio: 0.7,
  /** Score needed for each level */
  highScore: 60,
  mediumScore: 30,
  /** The GPA field defaults to 45 when it was never set */
  unsetGpa: 45,
} as const

export type SemesterRecord = {
  academicYear: number
  semesterNo: number
  semesterHours?: number | null | undefined
  passHours?: number | null | undefined
  semesterAverage?: number | null | undefined
  accumulativeAverage?: number | null | undefined
  academicWarning?: string | null | undefined
  academicStatus?: string | null | undefined
}

export type ActiveWarning = { caption: string; value: string }

export type RiskInput = {
  /** student_data.gpa */
  gpa: number | null | undefined
  semesters: SemesterRecord[]
  activeWarnings: ActiveWarning[]
}

export type RiskFactor = {
  code: string
  points: number
  message: string
  messageAr: string
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'unknown'
export type Trend = 'improving' | 'stable' | 'declining' | 'unknown'

export type RiskResult = {
  score: number
  level: RiskLevel
  trend: Trend
  gpa: number | null
  factors: RiskFactor[]
}

const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)
const round1 = (n: number) => Math.round(n * 10) / 10

export function sortSemesters<T extends SemesterRecord>(semesters: T[]): T[] {
  return [...semesters].sort(
    (a, b) => a.academicYear - b.academicYear || a.semesterNo - b.semesterNo,
  )
}

/** Best estimate of the current GPA: latest cumulative average, else the stored GPA if it was ever set. */
export function currentGpa(input: RiskInput): number | null {
  const withCumulative = sortSemesters(input.semesters).filter((s) => isNum(s.accumulativeAverage))
  const latest = withCumulative.at(-1)
  if (latest && isNum(latest.accumulativeAverage)) return round1(latest.accumulativeAverage)
  if (isNum(input.gpa) && input.gpa > RISK_THRESHOLDS.unsetGpa) return round1(input.gpa)
  return null
}

export function computeTrend(semesters: SemesterRecord[]): { trend: Trend; delta: number | null } {
  const avgs = sortSemesters(semesters)
    .map((s) => s.semesterAverage)
    .filter(isNum)
  if (avgs.length < 2) return { trend: 'unknown', delta: null }
  const delta = round1(avgs[avgs.length - 1]! - avgs[avgs.length - 2]!)
  if (delta >= RISK_THRESHOLDS.drop) return { trend: 'improving', delta }
  if (delta <= -RISK_THRESHOLDS.drop) return { trend: 'declining', delta }
  return { trend: 'stable', delta }
}

export function computeRisk(input: RiskInput): RiskResult {
  const T = RISK_THRESHOLDS
  const sorted = sortSemesters(input.semesters)
  const gpa = currentGpa(input)
  const hasSemesterData = sorted.some((s) => isNum(s.semesterAverage))

  if (gpa === null && !hasSemesterData) {
    return {
      score: 0,
      level: 'unknown',
      trend: 'unknown',
      gpa: null,
      factors: [
        {
          code: 'no-data',
          points: 0,
          message: 'Not enough academic data to assess risk.',
          messageAr: 'لا تتوفر بيانات أكاديمية كافية لتقييم المخاطر.',
        },
      ],
    }
  }

  const factors: RiskFactor[] = []
  const add = (code: string, points: number, message: string, messageAr: string) =>
    factors.push({ code, points, message, messageAr })

  if (gpa !== null) {
    if (gpa < T.probationGpa) {
      add('gpa-critical', 60, `GPA is ${gpa}, below the ${T.probationGpa} probation line.`, `المعدل التراكمي ${gpa} وهو أقل من حد الإنذار (${T.probationGpa}).`)
    } else if (gpa < T.watchGpa) {
      add('gpa-low', 30, `GPA is ${gpa}, close to the probation line (${T.probationGpa}).`, `المعدل التراكمي ${gpa} وهو قريب من حد الإنذار (${T.probationGpa}).`)
    } else if (gpa < T.comfortableGpa) {
      add('gpa-moderate', 10, `GPA is ${gpa}, below a comfortable margin (${T.comfortableGpa}).`, `المعدل التراكمي ${gpa} وهو أقل من الهامش الآمن (${T.comfortableGpa}).`)
    }
  }

  const { trend, delta } = computeTrend(sorted)
  if (delta !== null && delta <= -T.sharpDrop) {
    add('sharp-decline', 20, `Semester average fell by ${Math.abs(delta)} points since the previous semester.`, `انخفض معدل الفصل بمقدار ${Math.abs(delta)} نقطة عن الفصل السابق.`)
  } else if (delta !== null && delta <= -T.drop) {
    add('decline', 10, `Semester average fell by ${Math.abs(delta)} points since the previous semester.`, `انخفض معدل الفصل بمقدار ${Math.abs(delta)} نقطة عن الفصل السابق.`)
  }

  const latest = sorted.at(-1)
  if (latest && isNum(latest.semesterAverage) && latest.semesterAverage < T.lowSemesterAverage) {
    add('low-semester', 15, `Latest semester average is ${round1(latest.semesterAverage)}.`, `معدل الفصل الأخير ${round1(latest.semesterAverage)}.`)
  }

  if (latest && isNum(latest.semesterHours) && latest.semesterHours > 0 && isNum(latest.passHours)) {
    const ratio = latest.passHours / latest.semesterHours
    const pct = Math.round(ratio * 100)
    if (ratio < T.poorPassRatio) {
      add('poor-pass-rate', 25, `Passed only ${latest.passHours} of ${latest.semesterHours} hours last semester (${pct}%).`, `نجح في ${latest.passHours} ساعة فقط من ${latest.semesterHours} في الفصل الأخير (${pct}%).`)
    } else if (ratio < T.weakPassRatio) {
      add('weak-pass-rate', 15, `Passed ${latest.passHours} of ${latest.semesterHours} hours last semester (${pct}%).`, `نجح في ${latest.passHours} من ${latest.semesterHours} ساعة في الفصل الأخير (${pct}%).`)
    }
  }

  if (input.activeWarnings.length > 0) {
    const pts = Math.min(30, input.activeWarnings.length * 10)
    const n = input.activeWarnings.length
    add('active-warnings', pts, `${n} unresolved academic warning${n > 1 ? 's' : ''}.`, `يوجد ${n} إنذار أكاديمي غير محلول.`)
  }

  if (latest?.academicWarning?.trim()) {
    add('semester-warning', 10, `Latest semester record carries a warning: "${latest.academicWarning.trim().slice(0, 80)}".`, `سجل الفصل الأخير يتضمن تنبيهاً: "${latest.academicWarning.trim().slice(0, 80)}".`)
  }

  const score = Math.min(100, factors.reduce((sum, f) => sum + f.points, 0))
  const level: RiskLevel = score >= T.highScore ? 'high' : score >= T.mediumScore ? 'medium' : 'low'
  return { score, level, trend, gpa, factors }
}
