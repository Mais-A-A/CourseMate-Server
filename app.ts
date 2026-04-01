import express from 'express'
import { connectDatabase } from './src/config/db.js'
import { settings } from './src/config/settings.js'
import cookieParser from 'cookie-parser'
import passport from './src/config/passport.js'
import authRouter from './src/routers/auth.route.js'
const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(passport.initialize())
app.use(passport.session())
app.use('/api/auth', authRouter)
app.get('/', (req, res) => {
  res.send('Server is running!')
})

connectDatabase()
  .then(() => {
    app.listen(settings.serverPort, () => {
      console.log(`Server running on http://localhost:${settings.serverPort}`)
      console.log(`Environment: ${settings.env}`)
    })
  })
  .catch((err) => {
    console.error('Failed to start server:', err)
  })


export default app
