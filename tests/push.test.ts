import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import mongoose from 'mongoose'
import request from 'supertest'
import env from '../env.js'

vi.mock('web-push', () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() },
}))

import webpush from 'web-push'
import app from '../app.js'
import { User } from '../src/features/user/user.model.js'
import { Notification } from '../src/features/notification/notification.model.js'
import { PushSubscription } from '../src/features/push/pushSubscription.model.js'
import { resetPushConfig, isAllowedPushEndpoint } from '../src/features/push/push.service.js'
import { generateJWT } from '../src/shared/utils/authUtils.js'

const token = (local: string, role: 'student' | 'supervisor' | 'admin', name = local) =>
  `Bearer ${generateJWT({ email: `${local}@ppu.edu.ps`, name, avatar: '', role, studentId: role === 'student' ? local : null })}`

const sub = (n: number | string, host = 'fcm.googleapis.com') => ({
  endpoint: `https://${host}/fcm/send/device-${n}`,
  keys: { p256dh: 'BP'.padEnd(40, 'x'), auth: 'a'.repeat(16) },
})
const send = vi.mocked((webpush as any).sendNotification) as ReturnType<typeof vi.fn>

const enablePush = () => {
  process.env.VAPID_PUBLIC_KEY = 'public-key-for-tests'
  process.env.VAPID_PRIVATE_KEY = 'private-key-for-tests'
  resetPushConfig()
}
const disablePush = () => {
  delete process.env.VAPID_PUBLIC_KEY
  delete process.env.VAPID_PRIVATE_KEY
  resetPushConfig()
}

describe('isAllowedPushEndpoint (SSRF guard)', () => {
  it.each([
    'https://fcm.googleapis.com/fcm/send/abc',
    'https://updates.push.services.mozilla.com/wpush/v2/abc',
    'https://web.push.apple.com/abc',
    'https://wns2-par02p.notify.windows.com/?token=abc',
  ])('accepts %s', (u) => expect(isAllowedPushEndpoint(u)).toBe(true))

  it.each([
    'http://fcm.googleapis.com/fcm/send/abc',
    'https://evil.com/fcm.googleapis.com',
    'https://fcm.googleapis.com.evil.com/x',
    'https://169.254.169.254/latest/meta-data',
    'https://localhost/x',
    'https://user:pass@fcm.googleapis.com/x',
    'not a url',
    'file:///etc/passwd',
  ])('rejects %s', (u) => expect(isAllowedPushEndpoint(u)).toBe(false))
})

if (env.USE_REAL === 'false') {
  describe('Web Push', () => {
    let alice: any, bob: any, sup: any, student: any

    beforeAll(async () => {
      alice = await User.create({ name: 'Alice', email: '3001@ppu.edu', password: 'x', role: 'admin' })
      bob = await User.create({ name: 'Bob', email: '3002@ppu.edu', password: 'x', role: 'admin' })
      sup = await User.create({ name: 'Dr. One', email: 'sup1@ppu.edu', password: 'x', role: 'supervisor' })
      student = await User.create({
        name: 'Student 3003',
        email: '3003@ppu.edu',
        password: 'x',
        role: 'student',
        student_data: { studentNo: 3003, gpa: 80, academic_plan: new mongoose.Types.ObjectId(), supervisor: { supervisorEmail: 'sup1@ppu.edu.ps' } },
      } as any)
    })

    beforeEach(async () => {
      vi.clearAllMocks()
      send.mockResolvedValue({ statusCode: 201 })
      await PushSubscription.deleteMany({})
      await Notification.deleteMany({})
      vi.spyOn(console, 'error').mockImplementation(() => {})
      enablePush()
    })

    describe('GET /push/public-key', () => {
      it('requires login', async () => {
        expect((await request(app).get('/push/public-key')).status).toBe(401)
      })
      it('returns the key when configured and enabled:false when not', async () => {
        const on = await request(app).get('/push/public-key').set('Authorization', token('3001', 'student'))
        expect(on.body).toEqual({ enabled: true, publicKey: 'public-key-for-tests' })
        disablePush()
        const off = await request(app).get('/push/public-key').set('Authorization', token('3001', 'student'))
        expect(off.body).toEqual({ enabled: false, publicKey: null })
      })
    })

    describe('POST /push/subscribe', () => {
      const post = (body: object, who = '3001') => request(app).post('/push/subscribe').set('Authorization', token(who, 'student')).send(body)

      it('stores a valid subscription for the logged-in user', async () => {
        const res = await post(sub(1))
        expect(res.status).toBe(201)
        const saved: any = await PushSubscription.findOne().lean()
        expect(String(saved.userId)).toBe(String(alice._id))
        expect(saved.endpoint).toBe(sub(1).endpoint)
      })

      it('needs login', async () => {
        expect((await request(app).post('/push/subscribe').send(sub(1))).status).toBe(401)
      })

      it('rejects endpoints that are not real push services', async () => {
        expect((await post(sub(1, 'evil.com'))).status).toBe(400)
        expect((await post({ ...sub(1), endpoint: 'http://169.254.169.254/x' })).status).toBe(400)
        expect((await post({ ...sub(1), endpoint: 'https://fcm.googleapis.com.evil.com/x' })).status).toBe(400)
        expect(await PushSubscription.countDocuments()).toBe(0)
      })

      it('rejects malformed bodies', async () => {
        expect((await post({})).status).toBe(400)
        expect((await post({ endpoint: sub(1).endpoint })).status).toBe(400)
        expect((await post({ endpoint: sub(1).endpoint, keys: { p256dh: 'x', auth: 'y' } })).status).toBe(400)
      })

      it('is idempotent for the same device', async () => {
        await post(sub(1))
        await post(sub(1))
        expect(await PushSubscription.countDocuments()).toBe(1)
      })

      it('moves a device to the new account when someone else logs in on it', async () => {
        await post(sub(1), '3001')
        await post(sub(1), '3002')
        const saved: any[] = await PushSubscription.find().lean()
        expect(saved).toHaveLength(1)
        expect(String(saved[0].userId)).toBe(String(bob._id))
      })

      it('keeps at most 5 devices per user', async () => {
        for (let i = 1; i <= 7; i++) await post(sub(i))
        expect(await PushSubscription.countDocuments({ userId: alice._id } as any)).toBe(5)
      })

      it('answers 503 when push is not configured', async () => {
        disablePush()
        expect((await post(sub(1))).status).toBe(503)
      })
    })

    describe('DELETE /push/subscribe', () => {
      it('removes your own subscription only', async () => {
        await request(app).post('/push/subscribe').set('Authorization', token('3001', 'student')).send(sub(1))
        const other = await request(app).delete('/push/subscribe').set('Authorization', token('3002', 'student')).send({ endpoint: sub(1).endpoint })
        expect(other.status).toBe(404)
        expect(await PushSubscription.countDocuments()).toBe(1)
        const mine = await request(app).delete('/push/subscribe').set('Authorization', token('3001', 'student')).send({ endpoint: sub(1).endpoint })
        expect(mine.status).toBe(200)
        expect(await PushSubscription.countDocuments()).toBe(0)
      })
    })

    describe('delivery', () => {
      const subscribe = (userDoc: any, n: number) =>
        PushSubscription.create({ userId: userDoc._id, ...sub(n) } as any)

      it('pushes every notification created through the model', async () => {
        await subscribe(alice, 1)
        await subscribe(alice, 2)
        await (Notification as any).create({ userId: alice._id, type: 'info', message: 'Hello Alice', fromName: 'Dr. One' })
        await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(2))
        const [target, body] = send.mock.calls[0]!
        expect(target.endpoint).toContain('fcm.googleapis.com')
        const payload = JSON.parse(body)
        expect(payload).toMatchObject({ title: 'CourseMate · Dr. One', body: 'Hello Alice' })
        expect(payload.data.type).toBe('info')
      })

      it('pushes bulk inserts to each recipient and skips users with no devices', async () => {
        await subscribe(alice, 1)
        await (Notification as any).insertMany([
          { userId: alice._id, type: 'info', message: 'to alice' },
          { userId: bob._id, type: 'info', message: 'to bob (no device)' },
        ])
        await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1))
        expect(JSON.parse(send.mock.calls[0]![1]).body).toBe('to alice')
      })

      it('pushes when a supervisor messages a student through the API', async () => {
        await subscribe(student, 9)
        const res = await request(app).post('/supervisor/students/3003/notify').set('Authorization', token('sup1', 'supervisor', 'Dr. One')).send({ message: 'Please see me', type: 'reminder' })
        expect(res.status).toBe(201)
        await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1))
        expect(JSON.parse(send.mock.calls[0]![1])).toMatchObject({ title: 'CourseMate · Dr. One', body: 'Please see me' })
      })

      it('does nothing (and still saves the notification) when push is not configured', async () => {
        disablePush()
        await subscribe(alice, 1)
        await (Notification as any).create({ userId: alice._id, type: 'info', message: 'saved anyway' })
        await new Promise((r) => setTimeout(r, 50))
        expect(send).not.toHaveBeenCalled()
        expect(await Notification.countDocuments()).toBe(1)
      })

      it('removes subscriptions the browser reports as gone (404/410)', async () => {
        await subscribe(alice, 1)
        await subscribe(alice, 2)
        send.mockImplementation(async (s: any) => {
          if (s.endpoint.endsWith('device-1')) throw Object.assign(new Error('gone'), { statusCode: 410 })
          return { statusCode: 201 }
        })
        await (Notification as any).create({ userId: alice._id, type: 'info', message: 'x' })
        await vi.waitFor(async () => expect(await PushSubscription.countDocuments()).toBe(1))
        expect((await PushSubscription.findOne().lean())?.endpoint).toContain('device-2')
      })

      it('keeps the subscription on temporary errors and never breaks notification creation', async () => {
        await subscribe(alice, 1)
        send.mockRejectedValue(Object.assign(new Error('server busy'), { statusCode: 503 }))
        const n = await (Notification as any).create({ userId: alice._id, type: 'info', message: 'x' })
        expect(n._id).toBeTruthy()
        await vi.waitFor(() => expect(send).toHaveBeenCalled())
        await new Promise((r) => setTimeout(r, 50))
        expect(await PushSubscription.countDocuments()).toBe(1)
      })
    })

    describe('POST /push/test', () => {
      it('sends a test push to your own devices', async () => {
        await PushSubscription.create({ userId: alice._id, ...sub(1) } as any)
        const res = await request(app).post('/push/test').set('Authorization', token('3001', 'student'))
        expect(res.status).toBe(200)
        expect(res.body.data.delivered).toBe(1)
        expect(send).toHaveBeenCalledTimes(1)
      })
      it('does not push to other people and needs configuration', async () => {
        await PushSubscription.create({ userId: bob._id, ...sub(1) } as any)
        const res = await request(app).post('/push/test').set('Authorization', token('3001', 'student'))
        expect(res.body.data.delivered).toBe(0)
        disablePush()
        expect((await request(app).post('/push/test').set('Authorization', token('3001', 'student'))).status).toBe(503)
      })
    })
  })
}
