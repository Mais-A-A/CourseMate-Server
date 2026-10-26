import { Schema, model } from 'mongoose'

export const MEETING_STATUSES = ['scheduled', 'completed', 'cancelled', 'no_show'] as const
export const MEETING_MODES = ['in_person', 'online'] as const

const actionItemSchema = new Schema(
  {
    text: { type: String, required: true, maxlength: 300 },
    done: { type: Boolean, default: false },
  },
  { _id: true },
)

// The outcome and action items are private to the supervisor; students only see the schedule details.
const meetingSchema = new Schema(
  {
    studentNo: { type: Number, required: true },
    supervisorEmail: { type: String, required: true },
    supervisorName: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 30, min: 10, max: 240 },
    mode: { type: String, enum: MEETING_MODES, default: 'in_person' },
    location: { type: String, default: '', maxlength: 200 },
    agenda: { type: String, default: '', maxlength: 1000 },
    status: { type: String, enum: MEETING_STATUSES, default: 'scheduled' },
    outcome: { type: String, default: '', maxlength: 2000 },
    actionItems: { type: [actionItemSchema], default: [] },
    noteId: { type: Schema.Types.ObjectId, default: null },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true },
)
meetingSchema.index({ studentNo: 1, scheduledAt: -1 })
meetingSchema.index({ supervisorEmail: 1, scheduledAt: 1 })
meetingSchema.index({ status: 1, reminderSent: 1, scheduledAt: 1 })

export const Meeting = model('Meeting', meetingSchema)
export default Meeting
