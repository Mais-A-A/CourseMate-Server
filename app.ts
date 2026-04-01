import express from 'express'
import { connectDatabase } from './src/config/db.js'
import cookieParser from 'cookie-parser'
import passport from './src/config/passport.js'
import authRouter from './src/routes/auth.route.js'
import { academicRuleRouter } from './src/routes/academicRule.routes.js'
import { academicWarningRouter } from './src/routes/academicWarning.routes.js'
import { notificationRouter } from './src/routes/notification.routes.js'
import { userRouter } from './src/routes/user.routes.js'

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

connectDatabase().catch((err) => {
  console.error('Failed to start server:', err)
})

export default app
