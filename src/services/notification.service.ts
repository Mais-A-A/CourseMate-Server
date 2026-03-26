import { Notification } from '../models/notification.model.js'
import type { Notification as NotificationType } from '../schemas/notification.schemas.js'

class NotificationService {
  async createNotification(notificationData: NotificationType) {
    const notification = new Notification(notificationData)
    return await notification.save()
  }

  async getNotificationsByUserId(userId: string) {
    return await Notification.find({ userId }).sort({ createdAt: -1 }).lean()
  }

  async getNotificationById(notificationId: string) {
    return await Notification.findById(notificationId).lean()
  }

  async markAsRead(notificationId: string) {
    return await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true },
    )
  }

  async markAllAsRead(userId: string) {
    return await Notification.updateMany({ userId }, { isRead: true })
  }

  async deleteNotification(notificationId: string) {
    return await Notification.findByIdAndDelete(notificationId)
  }
}

export const notificationService = new NotificationService()
export default notificationService
