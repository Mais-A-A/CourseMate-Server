import user from '../models/user.model.js'
import aiRecomendation from '../models/AIRecomendation.model.js'

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
