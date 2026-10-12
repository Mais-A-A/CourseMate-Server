import { describe, it, expect } from 'vitest'
import { computeRisk, computeTrend, currentGpa, RISK_THRESHOLDS } from '../src/features/supervisor/risk.js'
import { ruleBasedInsight } from '../src/features/supervisor/insights.service.js'

const sem = (academicYear: number, semesterNo: number, extra: object = {}) => ({ academicYear, semesterNo, ...extra })

describe('computeRisk', () => {
  it('returns unknown when there is no usable data (default GPA of 45 counts as unset)', () => {
    const r = computeRisk({ gpa: 45, semesters: [], activeWarnings: [] })
    expect(r.level).toBe('unknown')
    expect(r.score).toBe(0)
    expect(r.gpa).toBeNull()
  })

  it('rates a strong, stable student as low risk with no factors', () => {
    const r = computeRisk({
      gpa: 85,
      semesters: [sem(2024, 1, { semesterAverage: 84, accumulativeAverage: 84, semesterHours: 15, passHours: 15 }), sem(2024, 2, { semesterAverage: 85, accumulativeAverage: 85, semesterHours: 15, passHours: 15 })],
      activeWarnings: [],
    })
    expect(r.level).toBe('low')
    expect(r.score).toBe(0)
    expect(r.factors).toHaveLength(0)
    expect(r.trend).toBe('stable')
  })

  it('flags a struggling student as high risk and explains every point', () => {
    const r = computeRisk({
      gpa: 58,
      semesters: [
        sem(2024, 1, { semesterAverage: 70, accumulativeAverage: 70, semesterHours: 15, passHours: 15 }),
        sem(2024, 2, { semesterAverage: 55, accumulativeAverage: 58, semesterHours: 18, passHours: 6 }),
      ],
      activeWarnings: [{ caption: 'Probation', value: '1' }],
    })
    expect(r.level).toBe('high')
    const codes = r.factors.map((f) => f.code)
    expect(codes).toEqual(expect.arrayContaining(['gpa-critical', 'sharp-decline', 'low-semester', 'poor-pass-rate', 'active-warnings']))
    expect(r.score).toBe(Math.min(100, r.factors.reduce((s, f) => s + f.points, 0)))
    expect(r.trend).toBe('declining')
    r.factors.forEach((f) => {
      expect(f.message).toBeTruthy()
      expect(f.messageAr).toBeTruthy()
    })
  })

  it('caps the score at 100', () => {
    const r = computeRisk({
      gpa: 50,
      semesters: [sem(2024, 1, { semesterAverage: 80, accumulativeAverage: 80 }), sem(2024, 2, { semesterAverage: 40, accumulativeAverage: 50, semesterHours: 15, passHours: 0, academicWarning: 'x' })],
      activeWarnings: [{ caption: 'a', value: 'b' }, { caption: 'a', value: 'b' }, { caption: 'a', value: 'b' }],
    })
    expect(r.score).toBe(100)
  })

  it('rates a GPA under the probation line as high risk on its own', () => {
    const r = computeRisk({ gpa: 58, semesters: [], activeWarnings: [] })
    expect(r.level).toBe('high')
  })

  it('puts a borderline student at medium', () => {
    const r = computeRisk({ gpa: 63, semesters: [sem(2024, 1, { semesterAverage: 63, accumulativeAverage: 63 })], activeWarnings: [] })
    expect(r.level).toBe('medium') // close to the probation line but not under it
    expect(r.score).toBeLessThan(RISK_THRESHOLDS.highScore)
  })

  it('caps the warnings contribution at 30 points', () => {
    const w = Array.from({ length: 6 }, () => ({ caption: 'c', value: 'v' }))
    const r = computeRisk({ gpa: 90, semesters: [], activeWarnings: w })
    expect(r.factors.find((f) => f.code === 'active-warnings')?.points).toBe(30)
  })
})

describe('helpers', () => {
  it('orders semesters by year then semester number before comparing', () => {
    const t = computeTrend([sem(2024, 2, { semesterAverage: 60 }), sem(2024, 1, { semesterAverage: 75 })])
    expect(t.trend).toBe('declining')
    expect(t.delta).toBe(-15)
  })
  it('prefers the latest cumulative average over the stored GPA', () => {
    expect(currentGpa({ gpa: 70, semesters: [sem(2024, 1, { accumulativeAverage: 66.04 })], activeWarnings: [] })).toBe(66)
  })
})

describe('ruleBasedInsight', () => {
  it('gives bilingual text and actions tied to the factors', () => {
    const risk = computeRisk({ gpa: 55, semesters: [], activeWarnings: [] })
    const en = ruleBasedInsight(risk, 'en')
    const ar = ruleBasedInsight(risk, 'ar')
    expect(en.source).toBe('rules')
    expect(en.suggestedActions.length).toBeGreaterThan(0)
    expect(en.summary).toContain('high')
    expect(/[؀-ۿ]/.test(ar.summary)).toBe(true)
  })
})
