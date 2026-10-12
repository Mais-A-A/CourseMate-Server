import { Schema, model } from 'mongoose'

export const NOTE_TYPES = ['general', 'meeting', 'advice', 'follow_up'] as const

// Private to supervisors: students can never read these.
const supervisorNoteSchema = new Schema(
  {
    studentNo: { type: Number, required: true },
    authorEmail: { type: String, required: true },
    authorName: { type: String, required: true },
    type: { type: String, enum: NOTE_TYPES, default: 'general' },
    body: { type: String, required: true, maxlength: 2000 },
    followUpDate: { type: Date, default: null },
    followUpDone: { type: Boolean, default: false },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true },
)
supervisorNoteSchema.index({ studentNo: 1, createdAt: -1 })
supervisorNoteSchema.index({ followUpDone: 1, reminderSent: 1, followUpDate: 1 })

export const SupervisorNote = model('SupervisorNote', supervisorNoteSchema)
export default SupervisorNote
