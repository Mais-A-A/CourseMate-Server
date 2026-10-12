import mongoose from 'mongoose'
import { settings } from './settings.js'

export const connectDatabase = async (retries = 5) => {
  if (mongoose.connection.readyState === 1) return
  for (let attempt = 1; ; attempt++) {
    try {
      await mongoose.connect(settings.mongoURL, {})
      console.log('Connected to DB!')
      return
    } catch (err) {
      console.error(`Failed to connect to DB (attempt ${attempt}): ${err}`)
      if (attempt > retries) throw err
      await new Promise((r) => setTimeout(r, Math.min(2000 * attempt, 10000)))
    }
  }
}
