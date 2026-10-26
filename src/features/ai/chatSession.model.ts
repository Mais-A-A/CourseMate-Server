import { Schema, model } from 'mongoose'

const chatMessageSchema = new Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

const pendingScheduleSchema = new Schema(
  {
    acdYear: { type: Number },
    semesterNo: { type: Number },
    preferences: { type: String },
    waitingForPreferences: { type: Boolean },
  },
  { _id: false },
)

const chatSessionSchema = new Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    studentNo: { type: String, required: true, index: true },
    title: { type: String, default: 'New chat' },
    titleIsAuto: { type: Boolean, default: true },
    messages: { type: [chatMessageSchema], default: [] },
    pendingSchedule: { type: pendingScheduleSchema, default: null },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

chatSessionSchema.index({ studentNo: 1, lastMessageAt: -1 })

export const ChatSession = model('ChatSession', chatSessionSchema)
export default ChatSession
