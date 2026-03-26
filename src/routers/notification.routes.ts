import { notificationController } from '../controllers/notification.controller.js'
import { Router } from 'express'
const notificationRouter = Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - userId
 *         - type
 *         - message
 *       properties:
 *         userId:
 *           type: string
 *         type:
 *           type: string
 *           maxLength: 100
 *         message:
 *           type: string
 *           maxLength: 255
 *         isRead:
 *           type: boolean
 *           default: false
 */

/**
 * @swagger
 * /notifications/user/{userId}:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get all notifications for a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
notificationRouter.get(
  '/user/:userId',
  notificationController.getNotificationsByUserId,
)

/**
 * @swagger
 * /notifications/user/{userId}/read:
 *   put:
 *     tags:
 *       - Notifications
 *     summary: Mark all notifications as read for a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
notificationRouter.put(
  '/user/:userId/read',
  notificationController.markAllAsRead,
)

/**
 * @swagger
 * /notifications/{notificationId}:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get a notification by ID
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
notificationRouter.get(
  '/:notificationId',
  notificationController.getNotificationById,
)

/**
 * @swagger
 * /notifications:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Create a new notification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Notification'
 *     responses:
 *       201:
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
notificationRouter.post('/', notificationController.createNotification)

/**
 * @swagger
 * /notifications/{notificationId}/read:
 *   put:
 *     tags:
 *       - Notifications
 *     summary: Mark a notification as read
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
notificationRouter.put(
  '/:notificationId/read',
  notificationController.markAsRead,
)

/**
 * @swagger
 * /notifications/{notificationId}:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Delete a notification by ID
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
notificationRouter.delete(
  '/:notificationId',
  notificationController.deleteNotification,
)

export { notificationRouter }
export default notificationRouter
