import type { Request, Response } from 'express'
import { rateLimit, ipKeyGenerator } from 'express-rate-limit'

const isTest = process.env.NODE_ENV === 'test'

function userOrIpKey(req: Request): string {
  return req.currentUser?.email ?? ipKeyGenerator(req.ip ?? '')
}

function limiter(opts: { windowMs: number; limit: number; message: string }) {
  return rateLimit({
    windowMs: opts.windowMs,
    limit: opts.limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => isTest,
    keyGenerator: userOrIpKey,
    handler: (req: Request, res: Response) => {
      const resetTime = (req as Request & { rateLimit?: { resetTime?: Date } }).rateLimit
        ?.resetTime
      const retryAfter = resetTime
        ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
        : Math.ceil(opts.windowMs / 1000)
      res.status(429).json({ error: opts.message, retryAfter })
    },
  })
}

/** Whole API, per IP: protects against general abuse. */
export const globalLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  message: 'Too many requests, please try again later.',
})

/** AI chat, per user: 10 messages/minute. */
export const chatBurstLimiter = limiter({
  windowMs: 60 * 1000,
  limit: 10,
  message: 'You are sending messages too fast. Please wait a moment. / الرجاء الانتظار قليلاً قبل إرسال رسالة جديدة.',
})

/** AI chat, per user: 150 messages/day (caps Gemini cost). */
export const chatDailyLimiter = limiter({
  windowMs: 24 * 60 * 60 * 1000,
  limit: 150,
  message: 'Daily message limit reached. Try again tomorrow. / وصلت للحد اليومي للرسائل، حاول مجدداً غداً.',
})

/** Schedule generation (expensive Gemini call), per user: 5 per 10 minutes. */
export const scheduleLimiter = limiter({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  message: 'Too many schedule requests. Please wait a few minutes. / الرجاء الانتظار بضع دقائق قبل إنشاء جدول جديد.',
})

/** Login-code exchange, per IP: blocks brute-forcing of one-time codes. */
export const authExchangeLimiter = limiter({
  windowMs: 60 * 1000,
  limit: 20,
  message: 'Too many attempts. Please wait a minute.',
})

/** AI risk insights for supervisors, per user: 20 per hour. */
export const insightsLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: 'Too many insight requests. Please try again later.',
})

/** Supervisor -> student notifications, per user: 30 requests per hour (a bulk send counts once). */
export const notifyLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  message: 'You are sending too many notifications. Please try again later.',
})
