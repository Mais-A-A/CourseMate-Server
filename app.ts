import express from 'express'
import { connectDatabase } from './src/config/db.js'
import { settings } from './src/config/settings.js'

const app = express()

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Server is running!')
})

connectDatabase().catch((err) => {
  console.error('Failed to start server:', err)
})

export default app
