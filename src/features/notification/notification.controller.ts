import e from 'express'
import { notificationService } from './notification.service.js'
import type { Request, Response } from 'express'

class NotificationController {
  async createNotification(req: Request, res: Response) {
    try {
      const notification = await notificationService.createNotification(
        req.body,
      )
      res.status(201).json(notification)
    } catch (error) {
      res.status(500).json({ error: 'Failed to create notification' })
    }
  }
  async getNotificationById(req: Request, res: Response) {
    try {
      const notification = await notificationService.getNotificationById(
        req.params.notificationId as string,
      )
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' })
      }
      res.json(notification)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch notification' })
    }
  }
  async getNotificationsByUserId(req: Request, res: Response) {
    try {
      const notifications = await notificationService.getNotificationsByUserId(
        req.params.userId as string,
      )
      res.json(notifications)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch notifications' })
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const notification = await notificationService.markAsRead(
        req.params.notificationId as string,
      )

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' })
      }
      res.json(notification)
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark notification as read' })
    }
  }

  async markAllAsRead(req: Request, res: Response) {
    try {
      await notificationService.markAllAsRead(req.params.userId as string)
      res.json({ message: 'All notifications marked as read' })
    } catch (error) {
      res
        .status(500)
        .json({ error: 'Failed to mark all notifications as read' })
    }
  }

  async deleteNotification(req: Request, res: Response) {
    try {
      const notification = await notificationService.deleteNotification(
        req.params.notificationId as string,
      )
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' })
      }
      res.json({ message: 'Notification deleted successfully' })
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete notification' })
    }
  }
}

export const notificationController = new NotificationController()
export default notificationController
