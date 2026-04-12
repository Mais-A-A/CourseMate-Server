import express from 'express'
import { connectDatabase } from './src/config/db.js'
import cookieParser from 'cookie-parser'
import passport from './src/config/passport.js'
import authRouter from './src/routes/auth.route.js'
import { userRouter } from './src/routes/user.routes.js'
import { notificationRouter } from './src/routes/notification.routes.js'
import { academicWarningRouter } from './src/routes/academicWarning.routes.js'
import { academicRuleRouter } from './src/routes/academicRule.routes.js'
import { academicPlanRouter } from './src/routes/academicPlan.routes.js'
import { aiRecomendationRouter } from './src/routes/AIRecomendation.routes.js'
import { courseRouter } from './src/routes/course.routes.js'
import { courseSectionRouter } from './src/routes/courseSection.routes.js'
import { departmentRouter } from './src/routes/department.routes.js'
import { scheduleRouter } from './src/routes/schedule.routes.js'
import aiRoutes from './src/routes/ai.route.js'
const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(passport.initialize())
app.use('/api/auth', authRouter)
app.use('/academic-rule', academicRuleRouter)
app.use('/academic-warning', academicWarningRouter)
app.use('/notification', notificationRouter)
app.use('/user', userRouter)
app.use(
  '/ai',

  aiRoutes,
)

app.get('/health', (req, res) => {
  res.send('Server is running!')
})

app.use('/user', userRouter)
app.use('/notification', notificationRouter)
app.use('/academic-warning', academicWarningRouter)
app.use('/academic-rule', academicRuleRouter)
app.use('/academic-plan', academicPlanRouter)
app.use('/ai-recomendation', aiRecomendationRouter)
app.use('/course', courseRouter)
app.use('/course-section', courseSectionRouter)
app.use('/department', departmentRouter)
app.use('/schedule', scheduleRouter)

if (process.env.NODE_ENV !== 'test') {
  connectDatabase().catch((err) => {
    console.error('Failed to start server:', err)
  })
}

export default app
