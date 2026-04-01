import express from 'express'
import { connectDatabase } from './src/config/db.js'
import { userRouter } from './src/routers/user.routes.js'
import { notificationRouter } from './src/routers/notification.routes.js'
import { academicWarningRouter } from './src/routers/academicWarning.routes.js'
import { academicRuleRouter } from './src/routers/academicRule.routes.js'

const app = express()

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Server is running!')
})

app.use('/user', userRouter)
app.use('/notification', notificationRouter)
app.use('/academic-warning', academicWarningRouter)
app.use('/academic-rule', academicRuleRouter)
if (process.env.NODE_ENV !== 'test') {
  connectDatabase().catch((err) => {
    console.error('Failed to start server:', err)
  })
}

export default app
