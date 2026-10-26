import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../shared/middlewares/auth.middleware.js'
import { pushSubscribeLimiter, pushTestLimiter } from '../../shared/middlewares/rateLimit.js'
import { User } from '../user/user.model.js'
import { emailMatcher } from '../supervisor/supervisor.service.js'
import {
  getPublicKey,
  isAllowedPushEndpoint,
  saveSubscription,
  removeSubscription,
  sendPushToUser,
} from './push.service.js'

const pushRouter = Router()

const SubscriptionBody = z.object({
  endpoint: z.string().url().max(1000).refine(isAllowedPushEndpoint, { message: 'Unsupported push service' }),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(10).max(100) }),
})
const UnsubscribeBody = z.object({ endpoint: z.string().max(1000) })

async function currentUserId(req: Request): Promise<string | null> {
  const user: any = await User.findOne({ email: emailMatcher(req.currentUser!.email) }).select('_id').lean()
  return user ? String(user._id) : null
}

/**
 * @swagger
 * /push/public-key:
 *   get:
 *     tags: [Push]
 *     summary: VAPID public key for Web Push
 *     description: "`enabled:false` means the server has no VAPID keys configured; hide the notifications toggle."
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: "{ enabled, publicKey }"
 */
pushRouter.get('/public-key', requireAuth(), (_req, res) => {
  const publicKey = getPublicKey()
  res.json({ enabled: !!publicKey, publicKey })
})

/**
 * @swagger
 * /push/subscribe:
 *   post:
 *     tags: [Push]
 *     summary: Register this browser for push notifications
 *     description: Send the JSON of `PushSubscription` from `registration.pushManager.subscribe(...)`. A user can have up to 5 devices.
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [endpoint, keys]
 *             properties:
 *               endpoint: { type: string }
 *               keys:
 *                 type: object
 *                 properties:
 *                   p256dh: { type: string }
 *                   auth: { type: string }
 *     responses:
 *       201:
 *         description: Subscribed
 *       400:
 *         description: Invalid subscription or unsupported push service
 *       503:
 *         description: Push is not configured on the server
 *   delete:
 *     tags: [Push]
 *     summary: Unsubscribe this browser
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [endpoint]
 *             properties:
 *               endpoint: { type: string }
 *     responses:
 *       200:
 *         description: Unsubscribed
 *       404:
 *         description: Subscription not found
 */
pushRouter.post('/subscribe', requireAuth(), pushSubscribeLimiter, async (req: Request, res: Response) => {
  if (!getPublicKey()) return res.status(503).json({ success: false, error: 'Push notifications are not enabled' })
  const parsed = SubscriptionBody.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.flatten() })
  try {
    const userId = await currentUserId(req)
    if (!userId) return res.status(404).json({ success: false, error: 'User not found' })
    await saveSubscription(userId, parsed.data, req.headers['user-agent'])
    res.status(201).json({ success: true })
  } catch (error) {
    console.error('[Push] subscribe failed:', error)
    res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' })
  }
})

pushRouter.delete('/subscribe', requireAuth(), async (req: Request, res: Response) => {
  const parsed = UnsubscribeBody.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.flatten() })
  try {
    const userId = await currentUserId(req)
    if (!userId || !(await removeSubscription(userId, parsed.data.endpoint))) {
      return res.status(404).json({ success: false, error: 'Subscription not found' })
    }
    res.json({ success: true })
  } catch (error) {
    console.error('[Push] unsubscribe failed:', error)
    res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' })
  }
})

/**
 * @swagger
 * /push/test:
 *   post:
 *     tags: [Push]
 *     summary: Send yourself a test push notification
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: "{ delivered } - number of your devices the push was sent to"
 */
pushRouter.post('/test', requireAuth(), pushTestLimiter, async (req: Request, res: Response) => {
  if (!getPublicKey()) return res.status(503).json({ success: false, error: 'Push notifications are not enabled' })
  try {
    const userId = await currentUserId(req)
    if (!userId) return res.status(404).json({ success: false, error: 'User not found' })
    const delivered = await sendPushToUser(userId, {
      title: 'CourseMate',
      body: 'Notifications are working 🎉',
      tag: 'push-test',
    })
    res.json({ success: true, data: { delivered } })
  } catch (error) {
    console.error('[Push] test failed:', error)
    res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' })
  }
})

export { pushRouter }
export default pushRouter
