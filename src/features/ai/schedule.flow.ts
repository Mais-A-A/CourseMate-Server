import { HumanMessage, AIMessage } from '@langchain/core/messages'
import {
  generateSchedule,
  type GeneratedSchedule,
} from './schedule.generator.js'
import {
  getOrCreateSession,
  type PendingSchedule,
} from './session.service.js'
import { AISchedule } from './aiSchedule.model.js'

function extractScheduleParams(
  message: string,
  current: PendingSchedule,
): PendingSchedule {
  const numbers = message.match(/\d+/g)?.map(Number) ?? []
  const years = numbers.filter((n) => n >= 2000 && n <= 2100)
  const semesters = numbers.filter((n) => n >= 1 && n <= 3)

  let semesterNo = current.semesterNo ?? semesters[0]
  if (!semesterNo) {
    if (/الأول|الاول|أول|اول|first/i.test(message)) semesterNo = 1
    else if (/الثاني|ثاني|second/i.test(message)) semesterNo = 2
    else if (/الصيفي|صيف|summer/i.test(message)) semesterNo = 3
  }

  const result: PendingSchedule = {}
  const acdYear = current.acdYear ?? years[0]
  if (acdYear !== undefined) result.acdYear = acdYear
  if (semesterNo !== undefined) result.semesterNo = semesterNo
  return result
}

async function savePendingSchedule(userId: string, schedule: GeneratedSchedule): Promise<void> {
  await AISchedule.deleteMany({ studentNo: userId, status: 'pending' })
  await AISchedule.create({ ...schedule, studentNo: userId, status: 'pending' })
}

function formatScheduleResponse(schedule: GeneratedSchedule): string {
  const rows = schedule.sections
    .map(
      (s) =>
        `| ${s.courseName} | ${s.courseNo} | ${s.supervisorName ?? '-'} | ${s.secTime ?? '-'} | ${s.creditHours} |`,
    )
    .join('\n')

  const table = `| المساق | الرقم | المدرس | الوقت | الساعات |\n|--------|-------|--------|-------|---------|\n${rows}`

  const warnings =
    schedule.warnings.length > 0
      ? `\n\n⚠️ **تنبيهات:**\n${schedule.warnings.map((w) => `- ${w}`).join('\n')}`
      : ''

  return `**جدولك المقترح — الفصل ${schedule.semesterNo} / ${schedule.acdYear}**\n\n${table}\n\n**إجمالي الساعات:** ${schedule.totalCreditHours}\n\n${schedule.reasoning}${warnings}`
}

export async function* startScheduleFlowStream(
  sessionId: string,
  userId: string,
  message: string,
): AsyncGenerator<string> {
  const session = await getOrCreateSession(sessionId, userId)
  const reply =
    'لإنشاء جدولك أحتاج منك:\n1. العام الأكاديمي (مثال: 2025)\n2. رقم الفصل (1 للأول، 2 للثاني، 3 للصيفي)'
  session.pendingSchedule = {}
  session.history.push(new HumanMessage(message), new AIMessage(reply))
  yield reply
}

export async function* continuePendingScheduleStream(
  sessionId: string,
  userId: string,
  message: string,
): AsyncGenerator<string> {
  const session = await getOrCreateSession(sessionId, userId)
  const pending = session.pendingSchedule!

  if (pending.waitingForPreferences) {
    const preferences = message.trim()
    delete session.pendingSchedule
    try {
      const schedule = await generateSchedule({
        userId,
        acdYear: pending.acdYear!,
        semesterNo: pending.semesterNo!,
        preferences: preferences || undefined,
      })
      await savePendingSchedule(userId, schedule)
      const formatted = formatScheduleResponse(schedule)
      session.history.push(new HumanMessage(message), new AIMessage(formatted))
      yield formatted
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      yield `عذراً، حدث خطأ في إنشاء الجدول: ${msg}`
    }
    return
  }

  const params = extractScheduleParams(message, pending)

  if (!params.acdYear) {
    const reply = 'الرجاء تحديد العام الأكاديمي (مثال: 2025)'
    session.pendingSchedule = params
    session.history.push(new HumanMessage(message), new AIMessage(reply))
    yield reply
    return
  }

  if (!params.semesterNo) {
    const reply = 'الرجاء تحديد رقم الفصل (1 للأول، 2 للثاني، 3 للصيفي)'
    session.pendingSchedule = params
    session.history.push(new HumanMessage(message), new AIMessage(reply))
    yield reply
    return
  }

  // Check if user already indicated preferences (or no preferences) in this message
  const noPreferencePattern = /\bno\b|\bلا\b|no\s*pref|لا\s*تفضيل|none\b/i
  const alreadyAnsweredPrefs = noPreferencePattern.test(message)

  // Extract any non-numeric text as potential preferences
  const strippedMessage = message
    .replace(/\d+/g, '')
    .replace(/[,،.]/g, ' ')
    .trim()
  const hasPreferenceText =
    strippedMessage.length > 3 && !noPreferencePattern.test(strippedMessage)

  if (alreadyAnsweredPrefs || hasPreferenceText) {
    const preferences = hasPreferenceText ? strippedMessage : undefined
    delete session.pendingSchedule
    try {
      const schedule = await generateSchedule({
        userId,
        acdYear: params.acdYear!,
        semesterNo: params.semesterNo!,
        preferences,
      })
      await savePendingSchedule(userId, schedule)
      const formatted = formatScheduleResponse(schedule)
      session.history.push(new HumanMessage(message), new AIMessage(formatted))
      yield formatted
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      yield `عذراً، حدث خطأ في إنشاء الجدول: ${msg}`
    }
    return
  }

  const reply =
    'هل لديك أي تفضيلات للجدول؟ (مثال: تجنب المحاضرات الصباحية، لا دوام لأيام معينه،.. إلخ)\nأو اكتب "لا" إذا لم يكن لديك تفضيلات.'
  session.pendingSchedule = { ...params, waitingForPreferences: true }
  session.history.push(new HumanMessage(message), new AIMessage(reply))
  yield reply
}
