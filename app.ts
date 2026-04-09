import express from 'express'
import { connectDatabase } from './src/config/db.js'
import { userRouter } from './src/routers/user.routes.js'
import { notificationRouter } from './src/routers/notification.routes.js'
import { academicWarningRouter } from './src/routers/academicWarning.routes.js'
import { academicRuleRouter } from './src/routers/academicRule.routes.js'
import { academicPlanRouter } from './src/routers/academicPlan.routes.js'
import { aiRecomendationRouter } from './src/routers/AIRecomendation.routes.js'
import { courseRouter } from './src/routers/course.routes.js'
import { courseSectionRouter } from './src/routers/courseSection.routes.js'
import { departmentRouter } from './src/routers/department.routes.js'
import { scheduleRouter } from './src/routers/schedule.routes.js'

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(passport.initialize())
app.use('/api/auth', authRouter)
app.use('/academic-rule', academicRuleRouter)
app.use('/academic-warning', academicWarningRouter)
app.use('/notification', notificationRouter)
app.use('/user', userRouter)

app.get('/', (req, res) => {
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
