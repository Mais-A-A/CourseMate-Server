import { Schema, model } from 'mongoose'

// One-time login codes: the OAuth redirect carries a short-lived code instead of the JWT itself.
const authCodeSchema = new Schema({
  code: { type: String, required: true, unique: true },
  token: { type: String, required: true },
  // MongoDB deletes the document ~60s after creation, used or not.
  createdAt: { type: Date, default: Date.now, expires: 60 },
})

export const AuthCode = model('AuthCode', authCodeSchema)
export default AuthCode
