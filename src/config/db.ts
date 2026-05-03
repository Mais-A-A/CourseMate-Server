import mongoose from 'mongoose'
import { settings } from './settings.js'

export const connectDatabase = async () => {
  try {
    await mongoose.connect(settings.mongoURL, {})
    console.log('Connected to DB!')
  } catch (err) {
    console.error('Failed to connect to DB: ' + err)
    throw err
  }
}
