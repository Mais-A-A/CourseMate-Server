import { Schema, model } from 'mongoose'

export const EVENT_TYPES = [
  'chat_message',
  'intent',
  'injection_blocked',
  'ai_failure',
  'chat_limit_reached',
  'schedule_generated',
  'schedule_approved',
  'risk_insight_generated',
  'supervisor_notification',
  'supervisor_note',
] as const
export type EventType = (typeof EVENT_TYPES)[number]

// Usage analytics only: never store message text or other private content in `meta`.
const eventSchema = new Schema({
  type: { type: String, enum: EVENT_TYPES, required: true },
  studentNo: { type: String },
  meta: { type: Schema.Types.Mixed, default: {} },
  // Events are deleted automatically after 180 days
  createdAt: { type: Date, default: Date.now, expires: 180 * 24 * 60 * 60 },
})
eventSchema.index({ type: 1, createdAt: -1 })

export const Event = model('Event', eventSchema)
export default Event
