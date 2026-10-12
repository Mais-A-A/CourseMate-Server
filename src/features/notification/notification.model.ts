import { Schema, model } from 'mongoose'
import { pushForNotification } from '../push/push.service.js'
import { NOTIFICATION_TYPES } from './notification.schemas.js'

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    // Set when a supervisor/admin sends the notification, so students can see who it is from
    fromName: { type: String },
    fromRole: { type: String, enum: ['supervisor', 'admin'] },
    sentBy: { type: String, select: false }, // internal: hidden from API responses
  },
  { timestamps: true },
)
notificationSchema.index({ sentBy: 1, createdAt: -1 })

// Every notification, whichever code path created it, is also pushed to the user's devices (if enabled).
notificationSchema.post('save', (doc) => pushForNotification(doc))
notificationSchema.post('insertMany', (docs: any) => {
  for (const doc of Array.isArray(docs) ? docs : []) pushForNotification(doc)
})

export const Notification = model('Notification', notificationSchema)
export default Notification
