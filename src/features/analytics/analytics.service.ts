import user from '../user/user.model.js'
import { Event } from '../events/event.model.js'
import aiRecomendation from '../ai-recommendation/AIRecomendation.model.js'

// to be added later: Confidence score
type AnalyticsData = {
  totalStudents: number
  totalSupervisors: number
  totalAdmins: number
  totalAIRecomendations: number
  cashedAt: string
}
let cache: {
  data: AnalyticsData
  expiresAt: number
} | null = null
const TTL_MS = 15 * 60 * 1000 // 15 minutes
export async function getAnalytics(): Promise<AnalyticsData> {
  const now = Date.now()
  if (cache && cache.expiresAt > now) {
    return cache.data
  }
  const [roleCounts, totalAIRecomendations] = await Promise.all([
    user.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    aiRecomendation.countDocuments(),
  ])
  const byRole = Object.fromEntries(roleCounts.map((r) => [r._id, r.count]))
  const data: AnalyticsData = {
    totalStudents: byRole['student'] || 0,
    totalSupervisors: byRole['supervisor'] || 0,
    totalAdmins: byRole['admin'] || 0,
    totalAIRecomendations: totalAIRecomendations,
    cashedAt: new Date().toISOString(),
  }
  cache = { data, expiresAt: now + TTL_MS }
  return data
}


// Assumptions behind "estimated advising time saved": adjust to match reality before presenting.
export const TIME_SAVED_ASSUMPTIONS = {
  minutesPerAnsweredMessage: 2,
  minutesPerGeneratedSchedule: 20,
} as const

const usageCache = new Map<number, { data: unknown; expiresAt: number }>()
const USAGE_TTL_MS = 5 * 60 * 1000

export async function getUsageAnalytics(days: number) {
  const hit = usageCache.get(days)
  if (hit && hit.expiresAt > Date.now()) return hit.data

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const inRange = { createdAt: { $gte: since } }

  const [typeCounts, intentCounts, daily, activeStudents, scheduleStats, riskInsights, notifyStats, notesAdded] = await Promise.all([
    Event.aggregate([{ $match: inRange }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
    Event.aggregate([
      { $match: { ...inRange, type: 'intent' } },
      { $group: { _id: '$meta.intent', count: { $sum: 1 } } },
    ]),
    Event.aggregate([
      { $match: { ...inRange, type: 'chat_message' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Event.distinct('studentNo', { ...inRange, type: 'chat_message' }),
    Event.aggregate([
      { $match: { ...inRange, type: 'schedule_generated' } },
      {
        $group: {
          _id: null,
          conflictsResolved: { $sum: { $ifNull: ['$meta.conflictsResolved', 0] } },
          totalSections: { $sum: { $ifNull: ['$meta.sections', 0] } },
          count: { $sum: 1 },
        },
      },
    ]),
    Event.countDocuments({ ...inRange, type: 'risk_insight_generated' }),
    Event.aggregate([
      { $match: { ...inRange, type: 'supervisor_notification' } },
      { $group: { _id: null, requests: { $sum: 1 }, recipients: { $sum: { $ifNull: ['$meta.recipients', 0] } } } },
    ]),
    Event.countDocuments({ ...inRange, type: 'supervisor_note' }),
  ])

  const count = (type: string) => typeCounts.find((t) => t._id === type)?.count ?? 0
  const messages = count('chat_message')
  const blocked = count('injection_blocked')
  const failures = count('ai_failure')
  const generated = count('schedule_generated')
  const approved = count('schedule_approved')
  const answered = Math.max(0, messages - blocked - failures)
  const sched = scheduleStats[0]
  const minutesSaved =
    answered * TIME_SAVED_ASSUMPTIONS.minutesPerAnsweredMessage +
    generated * TIME_SAVED_ASSUMPTIONS.minutesPerGeneratedSchedule

  const data = {
    periodDays: days,
    since: since.toISOString(),
    chat: {
      messages,
      answered,
      activeStudents: activeStudents.length,
      limitReached: count('chat_limit_reached'),
      aiFailures: failures,
      failureRate: messages ? Math.round((failures / messages) * 1000) / 10 : 0,
      byIntent: Object.fromEntries(intentCounts.map((i) => [i._id ?? 'unknown', i.count])),
      perDay: daily.map((d) => ({ date: d._id, messages: d.count })),
    },
    schedules: {
      generated,
      approved,
      approvalRate: generated ? Math.round((approved / generated) * 1000) / 10 : 0,
      conflictsResolved: sched?.conflictsResolved ?? 0,
      averageSections: sched?.count ? Math.round((sched.totalSections / sched.count) * 10) / 10 : 0,
    },
    security: { promptInjectionsBlocked: blocked },
    supervisor: {
      riskInsightsGenerated: riskInsights,
      notificationsSent: notifyStats[0]?.recipients ?? 0,
      notesAdded,
    },
    estimatedAdvisingHoursSaved: Math.round((minutesSaved / 60) * 10) / 10,
    assumptions: TIME_SAVED_ASSUMPTIONS,
  }
  usageCache.set(days, { data, expiresAt: Date.now() + USAGE_TTL_MS })
  return data
}

/** For tests */
export function clearUsageCache() {
  usageCache.clear()
}
