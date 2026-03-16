import { notificationService } from '../src/services/notification.service.js'
import { userService } from '../src/services/user.service.js'
import { describe, it, expect } from 'vitest'
import type { Notification } from '../src/schemas/notification.schemas.js'

describe('Notification Service', () => {
  it('should create a new notification', async () => {
    const user: any = await userService.createUser({
      name: 'Hasan Al-Saafin',
      email: 'hasan@gmail.com',
      password: '1234',
      role: 'admin',
    })
    const notification: Notification = {
      userId: user!._id.toString(),
      type: 'info',
      message: 'This is a test notification',
      isRead: false,
    }
    const savedNotification =
      await notificationService.createNotification(notification)
    expect(savedNotification.message).toBe(notification.message)
  })

  it('should get notifications for a user', async () => {
    const user = await userService.getUserByEmail('hasan@gmail.com')
    const notifications = await notificationService.getNotificationsByUserId(
      user!._id.toString(),
    )
    expect(notifications.length).toBeGreaterThan(0)
  })
  it('should get a notification by ID', async () => {
    const notification = await notificationService.createNotification({
      userId: '69b819c1376ba34dbc403585',
      type: 'info',
      message: 'This is another test notification',
      isRead: false,
    })
    const fetchedNotification = await notificationService.getNotificationById(
      notification._id.toString(),
    )
    expect(fetchedNotification).not.toBeNull()
    expect(fetchedNotification?.message).toBe(notification.message)
  })
  it('should mark a notification as read', async () => {
    const user = await userService.getUserByEmail('hasan@gmail.com')
    const notifications = await notificationService.getNotificationsByUserId(
      user!._id.toString(),
    )
    const notificationId = notifications[0]?._id.toString()
    const updatedNotification = await notificationService.markAsRead(
      notificationId as string,
    )
    expect(updatedNotification).not.toBeNull()
    expect(updatedNotification?.isRead).toBe(true)
  })
  it('should mark all notifications as read for a user', async () => {
    const user: any = await userService.createUser({
      name: 'Hasan Al-Saafin',
      email: `hasan${Date.now()}@gmail.com`,
      password: '1234',
      role: 'admin',
    })
    const notification1: Notification = {
      userId: user!._id.toString(),
      type: 'info',
      message: 'This is a test notification 1',
      isRead: false,
    }
    await notificationService.createNotification(notification1)
    const notification2: Notification = {
      userId: user!._id.toString(),
      type: 'info',
      message: 'This is a test notification 2',
      isRead: false,
    }
    await notificationService.createNotification(notification2)
    const updatedNotifications = await notificationService.markAllAsRead(
      user!._id.toString(),
    )
    expect(updatedNotifications).not.toBeNull()
  })
  it('should delete a notification', async () => {
    const notification = await notificationService.createNotification({
      userId: '69b819c1376ba34dbc403585',
      type: 'info',
      message: 'This is a test notification to delete',
      isRead: false,
    })
    const deletedNotification = await notificationService.deleteNotification(
      notification._id.toString(),
    )
    expect(deletedNotification).not.toBeNull()
    expect(deletedNotification?._id.toString()).toBe(
      notification._id.toString(),
    )
  })
})
