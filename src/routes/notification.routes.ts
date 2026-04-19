import { notificationController } from '../controllers/notification.controller.js'
import { Router } from 'express'
import { notificationSchema } from '../schemas/notification.schemas.js'
import { validateRequest } from '../middlewares/validation.js'
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js'
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
 * /notification/user/{userId}:
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
notificationRouter.get(
  '/user/:userId',
  requireAuth,
  notificationController.getNotificationsByUserId,
)

/**
 * @swagger
 * /notification/user/{userId}/read:
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
notificationRouter.put(
  '/user/:userId/read',
  requireAuth,

  notificationController.markAllAsRead,
)

/**
 * @swagger
 * /notification/{notificationId}:
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
notificationRouter.get(
  '/:notificationId',
  requireAuth,
  notificationController.getNotificationById,
)

/**
 * @swagger
 * /notification:
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
notificationRouter.post(
  '/',
  requireAuth,
  validateRequest(notificationSchema),
  notificationController.createNotification,
)

/**
 * @swagger
 * /notification/{notificationId}/read:
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
notificationRouter.put(
  '/:notificationId/read',
  requireAuth,
  notificationController.markAsRead,
)

/**
 * @swagger
 * /notification/{notificationId}:
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
notificationRouter.delete(
  '/:notificationId',
  requireAuth,

  notificationController.deleteNotification,
)

export { notificationRouter }
export default notificationRouter
