import webpush from 'web-push'
import { PushSubscription } from './pushSubscription.model.js'

export type PushPayload = {
  title: string
  body: string
  url?: string
  tag?: string
  data?: Record<string, unknown>
}

const MAX_SUBSCRIPTIONS_PER_USER = 5

/**
 * The server will POST to whatever endpoint a client registers, so only the real browser push services
 * are accepted (otherwise a user could make the server call internal addresses: SSRF).
 */
const ALLOWED_PUSH_HOSTS = [
  'fcm.googleapis.com', // Chrome, Edge, Opera, Samsung, Brave
  'push.services.mozilla.com', // Firefox
  'push.apple.com', // Safari
  'notify.windows.com', // Windows (WNS)
]

export function isAllowedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint)
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      ALLOWED_PUSH_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))
    )
  } catch {
    return false
  }
}

let configured: boolean | null = null

export function isPushEnabled(): boolean {
  if (configured !== null) return configured
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) {
    configured = false
    return false
  }
  try {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:noreply@coursemate.xyz', pub, priv)
    configured = true
  } catch (error) {
    console.error('[Push] invalid VAPID configuration, push disabled:', error)
    configured = false
  }
  return configured
}

export const getPublicKey = () => (isPushEnabled() ? process.env.VAPID_PUBLIC_KEY! : null)

/** For tests */
export function resetPushConfig() {
  configured = null
}

export async function saveSubscription(
  userId: string,
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent?: string,
) {
  // A device that switches accounts moves to the new user; re-subscribing the same device is idempotent.
  await PushSubscription.findOneAndUpdate(
    { endpoint: sub.endpoint },
    { userId, keys: sub.keys, ...(userAgent ? { userAgent: userAgent.slice(0, 200) } : {}) },
    { upsert: true, returnDocument: 'after' },
  )
  const all = await PushSubscription.find({ userId }).sort({ updatedAt: -1 }).select('_id').lean()
  const excess = all.slice(MAX_SUBSCRIPTIONS_PER_USER)
  if (excess.length) await PushSubscription.deleteMany({ _id: { $in: excess.map((e) => e._id) } } as any)
}

export async function removeSubscription(userId: string, endpoint: string) {
  const res = await PushSubscription.deleteOne({ userId, endpoint } as any)
  return res.deletedCount > 0
}

/** Sends to all of a user's devices. Never throws: a failed push must not affect the request that caused it. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!isPushEnabled()) return 0
  try {
    const subs = await PushSubscription.find({ userId } as any).lean()
    if (subs.length === 0) return 0
    const body = JSON.stringify(payload)
    let delivered = 0
    await Promise.allSettled(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.keys!.p256dh, auth: s.keys!.auth } },
            body,
            { TTL: 24 * 60 * 60, urgency: 'normal', timeout: 10_000 },
          )
          delivered++
        } catch (error: any) {
          // 404/410: the browser unsubscribed or the subscription expired
          if (error?.statusCode === 404 || error?.statusCode === 410) {
            await PushSubscription.deleteOne({ _id: s._id })
          } else {
            console.error('[Push] delivery failed:', error?.statusCode ?? error?.message ?? error)
          }
        }
      }),
    )
    return delivered
  } catch (error) {
    console.error('[Push] sendPushToUser failed:', error)
    return 0
  }
}

type NotificationLike = {
  userId: unknown
  type: string
  message: string
  fromName?: string | null | undefined
  _id?: unknown
}

export function pushForNotification(n: NotificationLike): void {
  if (!isPushEnabled()) return
  const base = (process.env.CLIENT_URL ?? '').replace(/\/$/, '')
  void sendPushToUser(String(n.userId), {
    title: n.fromName ? `CourseMate · ${n.fromName}` : 'CourseMate',
    body: n.message.slice(0, 200),
    url: `${base}/dashboard`,
    tag: n._id ? String(n._id) : n.type,
    data: { notificationId: n._id ? String(n._id) : null, type: n.type },
  })
}
