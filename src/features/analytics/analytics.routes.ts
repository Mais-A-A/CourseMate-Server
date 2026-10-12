import { Router } from 'express'
import { analyticsController } from './analytics.controller.js'
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware.js'

const analyticsRouter = Router()

/**
 * @swagger
 * /analytics:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get system analytics
 *     description: Returns aggregated analytics data. Results are cached in memory for 15 minutes.
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalStudents:
 *                   type: number
 *                   example: 120
 *                 totalSupervisors:
 *                   type: number
 *                   example: 10
 *                 totalAdmins:
 *                   type: number
 *                   example: 3
 *                 totalAIRecomendations:
 *                   type: number
 *                   example: 45
 *                 cashedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-05-09T10:00:00.000Z"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
analyticsRouter.get(
  '/',
  requireAuth(),
  requireRole('admin'),
  analyticsController.getAnalytics,
)

/**
 * @swagger
 * /analytics/usage:
 *   get:
 *     tags: [Analytics]
 *     summary: Usage and impact of the AI assistant (admin)
 *     description: Aggregated from anonymous usage events (no message content). Cached for 5 minutes. `estimatedAdvisingHoursSaved` is an estimate based on `assumptions`.
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: days, schema: { type: integer, default: 30, minimum: 1, maximum: 180 } }
 *     responses:
 *       200:
 *         description: "data: { periodDays, chat{messages,answered,activeStudents,aiFailures,failureRate,byIntent,perDay[]}, schedules{generated,approved,approvalRate,conflictsResolved,averageSections}, security{promptInjectionsBlocked}, supervisor{riskInsightsGenerated}, estimatedAdvisingHoursSaved, assumptions }"
 */
analyticsRouter.get(
  '/usage',
  requireAuth(),
  requireRole('admin'),
  analyticsController.getUsage,
)

export { analyticsRouter }
export default analyticsRouter
