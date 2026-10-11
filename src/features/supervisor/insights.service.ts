import { geminiModel } from '../../config/gemini.js'
import { parseModelResponseContent } from '../../shared/utils/AIUtils.js'
import {
  SECURITY_RULES,
  neutralizeTags,
  redactSecrets,
  sanitizeUserText,
} from '../../shared/security/promptGuard.js'
import type { RiskResult, SemesterRecord, ActiveWarning } from './risk.js'

export type Insight = {
  summary: string
  suggestedActions: string[]
  source: 'ai' | 'rules'
  language: 'ar' | 'en'
  generatedAt: string
}

const ACTIONS: Record<string, { en: string; ar: string }> = {
  'gpa-critical': {
    en: 'Meet the student urgently to agree a recovery plan and review the probation rules.',
    ar: 'عقد لقاء عاجل مع الطالب للاتفاق على خطة تحسين ومراجعة قواعد الإنذار الأكاديمي.',
  },
  'gpa-low': {
    en: 'Schedule a meeting to review study habits and reduce next semester\'s load if needed.',
    ar: 'تحديد موعد لمراجعة أسلوب الدراسة وتخفيف العبء الدراسي للفصل القادم عند الحاجة.',
  },
  'gpa-moderate': {
    en: 'Encourage the student to target higher marks in core courses to build a safer margin.',
    ar: 'تشجيع الطالب على رفع علاماته في المواد الأساسية لبناء هامش أمان أفضل.',
  },
  'sharp-decline': {
    en: 'Ask what changed last semester (workload, personal circumstances, course difficulty).',
    ar: 'السؤال عن سبب التراجع في الفصل الأخير (العبء الدراسي، ظروف شخصية، صعوبة المواد).',
  },
  decline: {
    en: 'Check in early to see whether the dip is temporary.',
    ar: 'المتابعة المبكرة للتأكد من أن التراجع مؤقت.',
  },
  'low-semester': {
    en: 'Review the courses that pulled the semester average down and consider repeating them.',
    ar: 'مراجعة المواد التي خفضت معدل الفصل والنظر في إعادتها.',
  },
  'poor-pass-rate': {
    en: 'Recommend a lighter course load next semester and tutoring support for failed courses.',
    ar: 'التوصية بعبء دراسي أخف في الفصل القادم ودعم أكاديمي للمواد الراسب بها.',
  },
  'weak-pass-rate': {
    en: 'Review which courses were failed and plan when to repeat them.',
    ar: 'مراجعة المواد الراسب بها وتحديد موعد مناسب لإعادتها.',
  },
  'active-warnings': {
    en: 'Go through the open academic warnings with the student and agree on how to resolve each.',
    ar: 'مراجعة الإنذارات الأكاديمية المفتوحة مع الطالب والاتفاق على طريقة حل كل منها.',
  },
  'semester-warning': {
    en: 'Confirm the student understands the warning on their latest semester record.',
    ar: 'التأكد من أن الطالب يفهم التنبيه الموجود في سجل الفصل الأخير.',
  },
}

export function ruleBasedInsight(risk: RiskResult, language: 'ar' | 'en'): Insight {
  const ar = language === 'ar'
  const real = risk.factors.filter((f) => f.points > 0)
  let summary: string
  if (risk.level === 'unknown') {
    summary = ar ? 'لا تتوفر بيانات كافية لتقييم وضع الطالب.' : 'Not enough data to assess this student.'
  } else if (real.length === 0) {
    summary = ar ? 'وضع الطالب الأكاديمي جيد ولا توجد مؤشرات خطر حالياً.' : 'The student is in good academic standing with no risk indicators.'
  } else {
    const head = ar
      ? `مستوى الخطر ${{ high: 'مرتفع', medium: 'متوسط', low: 'منخفض', unknown: 'غير معروف' }[risk.level]} (${risk.score}/100). `
      : `Risk level is ${risk.level} (${risk.score}/100). `
    summary = head + real.map((f) => (ar ? f.messageAr : f.message)).join(' ')
  }
  const suggestedActions = real
    .sort((a, b) => b.points - a.points)
    .map((f) => ACTIONS[f.code]?.[language])
    .filter((a): a is string => !!a)
    .slice(0, 4)
  return { summary, suggestedActions, source: 'rules', language, generatedAt: new Date().toISOString() }
}

const clean = (s: unknown, max: number) => redactSecrets(neutralizeTags(sanitizeUserText(String(s ?? ''), max)))

function buildPrompt(risk: RiskResult, semesters: SemesterRecord[], warnings: ActiveWarning[], language: 'ar' | 'en') {
  const recent = semesters.slice(-4).map(
    (s) =>
      `- ${s.academicYear}/${s.semesterNo}: semester average ${s.semesterAverage ?? 'n/a'}, cumulative ${s.accumulativeAverage ?? 'n/a'}, passed ${s.passHours ?? 'n/a'} of ${s.semesterHours ?? 'n/a'} hours`,
  )
  const data = [
    `Risk level: ${risk.level} (score ${risk.score}/100), trend: ${risk.trend}, current GPA: ${risk.gpa ?? 'unknown'} (100-point scale)`,
    'Risk factors found by the system:',
    ...risk.factors.map((f) => `- ${f.message}`),
    'Recent semesters:',
    ...(recent.length ? recent : ['- none']),
    'Unresolved academic warnings:',
    ...(warnings.length ? warnings.slice(0, 5).map((w) => `- ${clean(w.caption, 80)}: ${clean(w.value, 120)}`) : ['- none']),
  ].join('\n')

  return `You are an assistant helping a university academic supervisor at Palestine Polytechnic University understand a student's situation.
Using ONLY the data below, write (1) a short summary of at most 3 sentences explaining the student's situation and the main reasons for the risk level, and (2) 2 to 4 concrete, practical actions the supervisor could take.
Write in ${language === 'ar' ? 'Arabic' : 'English'}. Be factual, supportive and specific. Do not invent facts that are not in the data. Do not mention the student's name.
${SECURITY_RULES}

<student_data>
${data}
</student_data>

Respond ONLY with JSON, no markdown: {"summary": "<string>", "suggestedActions": ["<string>", ...]}`
}

function parseInsight(raw: string, language: 'ar' | 'en'): Insight | null {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) return null
  try {
    const obj = JSON.parse(raw.slice(start, end + 1))
    const summary = typeof obj.summary === 'string' ? clean(obj.summary, 800) : ''
    const actions = Array.isArray(obj.suggestedActions)
      ? obj.suggestedActions.filter((a: unknown) => typeof a === 'string').map((a: string) => clean(a, 300)).filter(Boolean).slice(0, 4)
      : []
    if (!summary || actions.length === 0) return null
    return { summary, suggestedActions: actions, source: 'ai', language, generatedAt: new Date().toISOString() }
  } catch {
    return null
  }
}

const cache = new Map<string, { insight: Insight; expiresAt: number }>()
const CACHE_TTL_MS = 60 * 60 * 1000
const CACHE_MAX = 500

export async function generateInsight(args: {
  studentNo: number
  risk: RiskResult
  semesters: SemesterRecord[]
  warnings: ActiveWarning[]
  language: 'ar' | 'en'
}): Promise<Insight> {
  const { studentNo, risk, semesters, warnings, language } = args
  const last = semesters.at(-1)
  // The key changes whenever anything that affects the answer changes, so cached text is never stale.
  const key = [studentNo, language, risk.score, risk.level, warnings.length, last?.academicYear, last?.semesterNo, last?.semesterAverage].join('|')
  const hit = cache.get(key)
  if (hit && hit.expiresAt > Date.now()) return hit.insight

  let insight: Insight | null = null
  if (risk.level !== 'unknown') {
    try {
      const res = await geminiModel.invoke(buildPrompt(risk, semesters, warnings, language))
      insight = parseInsight(parseModelResponseContent(res.content), language)
    } catch (error) {
      console.error('[Insights] AI generation failed, using rule-based text:', error)
    }
  }
  insight ??= ruleBasedInsight(risk, language)

  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!)
  cache.set(key, { insight, expiresAt: Date.now() + CACHE_TTL_MS })
  return insight
}
