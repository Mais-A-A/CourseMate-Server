import mongoose from 'mongoose'
import { settings } from './settings.js'

export const connectDatabase = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/coursemate', {})
    console.log('Connected to DB!')
  } catch (err) {
    console.error('Failed to connect to DB: ' + err)
  }
}
