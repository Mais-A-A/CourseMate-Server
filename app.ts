import express, { type Request, type Response, type NextFunction } from 'express'
import { connectDatabase } from './src/config/db.js'
import cookieParser from 'cookie-parser'
import passport from './src/config/passport.js'
import authRouter from './src/features/auth/auth.routes.js'
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
import aiRoutes from './src/features/ai/ai.routes.js'
import knowledgeBaseRouter from './src/features/knowledge-base/knowledgeBase.routes.js'
import morgan from 'morgan'
import cors from 'cors'

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5500',
 'https://coursemate.xyz',     
  'https://www.coursemate.xyz',
]
const app = express()
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
app.use(morgan('dev'))
app.use(express.json())
app.use(cookieParser())
app.use(passport.initialize())

app.get('/health', (req, res) => {
  res.send('Server is running!')
})

// Routes
app.use('/api/auth', authRouter)
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
app.use('/knowledge-base', knowledgeBaseRouter)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error & { status?: number; type?: string }, req: Request, res: Response, _next: NextFunction) => {
  const status = (err as { status?: number }).status ?? 500
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid JSON in request body' })
    return
  }
  res.status(status).json({ error: err.message || 'Internal Server Error' })
})

if (process.env.NODE_ENV !== 'test') {
  connectDatabase().catch((err) => {
    console.error('Failed to start server:', err)
  })
}

export default app
