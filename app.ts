import express, { type Request, type Response, type NextFunction } from 'express'
import { connectDatabase } from './src/config/db.js'
import cookieParser from 'cookie-parser'
import passport from './src/config/passport.js'
import authRouter from './src/features/auth/auth.routes.js'
import { languageRouter } from './src/features/user/language.routes.js'
import { userRouter } from './src/features/user/user.routes.js'
import { notificationRouter } from './src/features/notification/notification.routes.js'
import { academicWarningRouter } from './src/features/academic-warning/academicWarning.routes.js'
import { academicRuleRouter } from './src/features/academic-rule/academicRule.routes.js'
import { academicPlanRouter } from './src/features/academic-plan/academicPlan.routes.js'
import { aiRecomendationRouter } from './src/features/ai-recommendation/AIRecomendation.routes.js'
import { courseRouter } from './src/features/course/course.routes.js'
import { courseSectionRouter } from './src/features/course-section/courseSection.routes.js'
import { departmentRouter } from './src/features/department/department.routes.js'
import { scheduleRouter } from './src/features/schedule/schedule.routes.js'
import { importantDatesRouter } from './src/features/important-dates/importantDates.routes.js'
import { analyticsRouter } from './src/features/analytics/analytics.routes.js'
import { studentMeetingsRouter } from './src/features/supervisor/meetings.routes.js'
import { supervisorRouter } from './src/features/supervisor/supervisor.routes.js'
import aiRoutes from './src/features/ai/ai.routes.js'
import knowledgeBaseRouter from './src/features/knowledge-base/knowledgeBase.routes.js'
import morgan from 'morgan'
import { globalLimiter } from './src/shared/middlewares/rateLimit.js'
import cors from 'cors'
import mongoose from 'mongoose'
import helmet from 'helmet'
import { i18n } from './src/shared/i18n/i18n.middleware.js'
import { mongoSanitize } from './src/shared/security/mongoSanitize.js'

const allowedOrigins = [
  'https://coursemate.xyz',
  'https://www.coursemate.xyz',
  // local development only
  ...(process.env.NODE_ENV === 'production'
    ? []
    : ['http://localhost:5173', 'http://127.0.0.1:5500']),
]
const app = express()
// Behind Render's proxy: use the real client IP for rate limiting
app.set('trust proxy', 1)
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  }),
)
app.use(helmet())
app.use(i18n)
app.use(morgan('dev'))
app.use(globalLimiter)
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())
app.use(mongoSanitize)
app.use(passport.initialize())

app.get('/health', (req, res) => {
  res.send('Server is running!')
})

// Readiness: 503 while MongoDB is not connected
app.get('/health/ready', (req, res) => {
  const dbUp = mongoose.connection.readyState === 1
  res.status(dbUp ? 200 : 503).json({ status: dbUp ? 'ok' : 'degraded', db: dbUp })
})

// Routes
app.use('/api/auth', authRouter)
app.use('/user/me/language', languageRouter)
app.use('/user', userRouter)
app.use('/notification', notificationRouter)
app.use('/academic-warning', academicWarningRouter)
app.use('/academic-rule', academicRuleRouter)
app.use('/academic-plan', academicPlanRouter)
app.use('/important-dates', importantDatesRouter)
app.use('/ai', aiRoutes)
app.use('/ai-recomendation', aiRecomendationRouter)
app.use('/course', courseRouter)
app.use('/course-section', courseSectionRouter)
app.use('/department', departmentRouter)
app.use('/schedule', scheduleRouter)
app.use('/analytics', analyticsRouter)
app.use('/supervisor', supervisorRouter)
app.use('/meetings', studentMeetingsRouter)
app.use('/knowledge-base', knowledgeBaseRouter)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error & { status?: number; type?: string }, req: Request, res: Response, _next: NextFunction) => {
  const status = (err as { status?: number }).status ?? 500
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid JSON in request body' })
    return
  }
  if (status >= 500) console.error('[Error]', err)
  // Never expose internal error details to clients in production
  const message =
    status >= 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error'
  res.status(status).json({ error: message })
})

if (process.env.NODE_ENV !== 'test') {
  connectDatabase().catch((err) => {
    console.error('Failed to start server:', err)
  })
}

export default app
