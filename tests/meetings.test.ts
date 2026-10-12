import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import mongoose from 'mongoose'
import request from 'supertest'
import env from '../env.js'

vi.mock('../src/config/gemini.js', () => ({
  geminiModel: { invoke: vi.fn(), stream: vi.fn() },
}))

import app from '../app.js'
import { geminiModel } from '../src/config/gemini.js'
import { User } from '../src/features/user/user.model.js'
import { Notification } from '../src/features/notification/notification.model.js'
import { Meeting } from '../src/features/supervisor/meeting.model.js'
import { SupervisorNote } from '../src/features/supervisor/note.model.js'
import { runMeetingReminders } from '../src/features/supervisor/reminders.service.js'
import { generateJWT } from '../src/shared/utils/authUtils.js'

const token = (local: string, role: 'student' | 'admin' | 'supervisor', name = local) =>
  `Bearer ${generateJWT({ email: `${local}@ppu.edu.ps`, name, avatar: '', role, studentId: role === 'student' ? local : null })}`
const sup1 = () => token('sup1', 'supervisor', 'Dr. One')
const sup2 = () => token('sup2', 'supervisor', 'Dr. Two')
const admin = () => token('adm1', 'admin')
const stu = (n: number) => token(String(n), 'student')

const inHours = (h: number) => new Date(Date.now() + h * 3600_000).toISOString()

async function makeStudent(studentNo: number, supervisorEmail: string, preferredLanguage?: 'ar' | 'en') {
  return User.create({
    name: `Student ${studentNo}`,
    email: `${studentNo}@ppu.edu`,
    password: 'x',
    role: 'student',
    ...(preferredLanguage && { preferredLanguage }),
    student_data: { studentNo, gpa: 70, academic_plan: new mongoose.Types.ObjectId(), supervisor: { supervisorEmail } },
  } as any) as any
}

if (env.USE_REAL === 'false') {
  describe('Advising meetings (HTTP)', () => {
    let s3001: any
    beforeAll(async () => {
      s3001 = await makeStudent(3001, 'sup1@ppu.edu.ps')
      await makeStudent(3002, 'sup1@ppu.edu', 'en')
      await makeStudent(3003, 'sup2@ppu.edu.ps')
    })
    beforeEach(async () => {
      await Meeting.deleteMany({})
      await Notification.deleteMany({})
      await SupervisorNote.deleteMany({})
      vi.clearAllMocks()
      vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    const create = (who: string, studentNo: number, body: object) =>
      request(app).post(`/supervisor/students/${studentNo}/meetings`).set('Authorization', who).send(body)

    describe('access', () => {
      it('is supervisor-only and limited to their own students', async () => {
        expect((await request(app).get('/supervisor/meetings')).status).toBe(401)
        expect((await request(app).get('/supervisor/meetings').set('Authorization', admin())).status).toBe(403)
        expect((await request(app).get('/supervisor/meetings').set('Authorization', stu(3001))).status).toBe(403)
        expect((await create(sup1(), 3003, { scheduledAt: inHours(5) })).status).toBe(404)
        expect((await create(admin(), 3001, { scheduledAt: inHours(5) })).status).toBe(403)
      })
    })

    describe('create', () => {
      it('saves the meeting and notifies the student in their language', async () => {
        const res = await create(sup1(), 3001, { scheduledAt: inHours(5), agenda: 'GPA review', location: 'Office 12' })
        expect(res.status).toBe(201)
        expect(res.body.data).toMatchObject({ studentNo: 3001, status: 'scheduled', durationMinutes: 30, mode: 'in_person', location: 'Office 12' })
        const n: any = await Notification.findOne({ userId: s3001._id }).lean()
        expect(n.message).toContain('Office 12')
        expect(n.message).toMatch(/[؀-ۿ]/) // default language is Arabic
        expect(n.fromRole).toBe('supervisor')

        const english = await create(sup1(), 3002, { scheduledAt: inHours(30) })
        expect(english.status).toBe(201)
        const en: any = await (Notification as any).findOne({ userId: (await User.findOne({ email: '3002@ppu.edu' }))!._id }).lean()
        expect(en.message).toContain('Advising meeting with Dr. One')
      })

      it('validates the date and fields', async () => {
        expect((await create(sup1(), 3001, {})).status).toBe(400)
        expect((await create(sup1(), 3001, { scheduledAt: 'nonsense' })).status).toBe(400)
        expect((await create(sup1(), 3001, { scheduledAt: inHours(-48) })).status).toBe(400)
        expect((await create(sup1(), 3001, { scheduledAt: inHours(24 * 400) })).status).toBe(400)
        expect((await create(sup1(), 3001, { scheduledAt: inHours(5), durationMinutes: 5 })).status).toBe(400)
        expect((await create(sup1(), 3001, { scheduledAt: inHours(5), mode: 'carrier-pigeon' })).status).toBe(400)
      })

      it('refuses overlapping meetings for the same supervisor but allows back-to-back', async () => {
        const start = new Date(Date.now() + 5 * 3600_000)
        expect((await create(sup1(), 3001, { scheduledAt: start.toISOString(), durationMinutes: 30 })).status).toBe(201)
        expect((await create(sup1(), 3002, { scheduledAt: new Date(start.getTime() + 10 * 60_000).toISOString() })).status).toBe(409)
        expect((await create(sup1(), 3002, { scheduledAt: new Date(start.getTime() + 30 * 60_000).toISOString() })).status).toBe(201)
        // another supervisor is not affected
        expect((await create(sup2(), 3003, { scheduledAt: start.toISOString() })).status).toBe(201)
      })
    })

    describe('update', () => {
      it('reschedules (notifies, checks overlaps) and cancels (notifies)', async () => {
        const a = (await create(sup1(), 3001, { scheduledAt: inHours(5) })).body.data._id
        const b = (await create(sup1(), 3002, { scheduledAt: inHours(10) })).body.data._id
        await Notification.deleteMany({})

        expect((await request(app).patch(`/supervisor/meetings/${a}`).set('Authorization', sup1()).send({ scheduledAt: inHours(10) })).status).toBe(409)
        const moved = await request(app).patch(`/supervisor/meetings/${a}`).set('Authorization', sup1()).send({ scheduledAt: inHours(20), location: 'Lab' })
        expect(moved.status).toBe(200)
        expect(await Notification.countDocuments({ userId: s3001._id })).toBe(1)

        const cancelled = await request(app).patch(`/supervisor/meetings/${b}`).set('Authorization', sup1()).send({ status: 'cancelled' })
        expect(cancelled.status).toBe(200)
        expect(cancelled.body.data.status).toBe('cancelled')
        expect(await Notification.countDocuments({ type: 'warning' })).toBe(1)
      })

      it('records the outcome as a note with a follow-up when completed', async () => {
        const id = (await create(sup1(), 3001, { scheduledAt: inHours(5) })).body.data._id
        const due = new Date(Date.now() + 7 * 86400_000).toISOString()
        const done = await request(app)
          .patch(`/supervisor/meetings/${id}`)
          .set('Authorization', sup1())
          .send({ status: 'completed', outcome: 'Agreed to drop one course', actionItems: [{ text: 'Submit drop form' }], followUpDate: due })
        expect(done.status).toBe(200)
        expect(done.body.data.actionItems).toHaveLength(1)
        const note: any = await SupervisorNote.findOne({ studentNo: 3001 }).lean()
        expect(note).toMatchObject({ type: 'meeting', body: 'Agreed to drop one course', authorEmail: 'sup1@ppu.edu.ps' })
        expect(note.followUpDate).toBeTruthy()

        // completing again does not create a second note
        await request(app).patch(`/supervisor/meetings/${id}`).set('Authorization', sup1()).send({ status: 'completed', outcome: 'Edited' })
        expect(await SupervisorNote.countDocuments({ studentNo: 3001 })).toBe(1)
      })

      it("cannot touch another supervisor's meeting", async () => {
        const id = (await create(sup2(), 3003, { scheduledAt: inHours(5) })).body.data._id
        expect((await request(app).patch(`/supervisor/meetings/${id}`).set('Authorization', sup1()).send({ agenda: 'x' })).status).toBe(404)
        expect((await request(app).delete(`/supervisor/meetings/${id}`).set('Authorization', sup1())).status).toBe(404)
        expect((await request(app).patch('/supervisor/meetings/not-an-id').set('Authorization', sup1()).send({ agenda: 'x' })).status).toBe(404)
        expect((await request(app).patch(`/supervisor/meetings/${id}`).set('Authorization', sup2()).send({})).status).toBe(400)
      })

      it('deletes a meeting and tells the student when it was still upcoming', async () => {
        const id = (await create(sup1(), 3001, { scheduledAt: inHours(5) })).body.data._id
        await Notification.deleteMany({})
        expect((await request(app).delete(`/supervisor/meetings/${id}`).set('Authorization', sup1())).status).toBe(200)
        expect(await Meeting.countDocuments()).toBe(0)
        expect(await Notification.countDocuments({ userId: s3001._id })).toBe(1)
      })
    })

    describe('calendar and lists', () => {
      it('lists a supervisor\'s meetings with date/status/student filters, never another supervisor\'s', async () => {
        await create(sup1(), 3001, { scheduledAt: inHours(5) })
        await create(sup1(), 3002, { scheduledAt: inHours(50) })
        await create(sup2(), 3003, { scheduledAt: inHours(7) })
        const all = await request(app).get('/supervisor/meetings').set('Authorization', sup1())
        expect(all.body.data.map((m: any) => m.studentNo)).toEqual([3001, 3002])
        const ranged = await request(app).get(`/supervisor/meetings?to=${encodeURIComponent(inHours(24))}`).set('Authorization', sup1())
        expect(ranged.body.data.map((m: any) => m.studentNo)).toEqual([3001])
        expect((await request(app).get('/supervisor/meetings?studentNo=3002').set('Authorization', sup1())).body.data).toHaveLength(1)
        expect((await request(app).get('/supervisor/meetings?status=completed').set('Authorization', sup1())).body.data).toHaveLength(0)
        expect((await request(app).get('/supervisor/meetings?status=bogus').set('Authorization', sup1())).status).toBe(400)
        expect((await request(app).get('/supervisor/students/3001/meetings').set('Authorization', sup1())).body.data).toHaveLength(1)
        expect((await request(app).get('/supervisor/students/3003/meetings').set('Authorization', sup1())).status).toBe(404)
      })
    })

    describe('prep', () => {
      it('returns AI talking points and saves nothing', async () => {
        const id = (await create(sup1(), 3001, { scheduledAt: inHours(5), agenda: 'GPA' })).body.data._id
        vi.mocked(geminiModel.invoke).mockResolvedValue({ content: '- point one\n- point two' } as any)
        const res = await request(app).get(`/supervisor/meetings/${id}/prep?lang=en`).set('Authorization', sup1())
        expect(res.status).toBe(200)
        expect(res.body.data.talkingPoints).toContain('point one')
        expect(await SupervisorNote.countDocuments()).toBe(0)
        expect((await request(app).get(`/supervisor/meetings/${id}/prep`).set('Authorization', sup2())).status).toBe(404)
      })
    })

    describe('student view', () => {
      it('shows students their own meetings without the private outcome', async () => {
        const id = (await create(sup1(), 3001, { scheduledAt: inHours(5), agenda: 'GPA' })).body.data._id
        await request(app).patch(`/supervisor/meetings/${id}`).set('Authorization', sup1()).send({ outcome: 'private words', actionItems: [{ text: 'secret' }] })
        const res = await request(app).get('/meetings/mine').set('Authorization', stu(3001))
        expect(res.status).toBe(200)
        expect(res.body.data).toHaveLength(1)
        expect(JSON.stringify(res.body)).not.toContain('private words')
        expect(JSON.stringify(res.body)).not.toContain('secret')
        expect((await request(app).get('/meetings/mine').set('Authorization', stu(3002))).body.data).toHaveLength(0)
        expect((await request(app).get('/meetings/mine').set('Authorization', sup1())).status).toBe(403)
        expect((await request(app).get('/meetings/mine')).status).toBe(401)
      })
    })

    describe('reminders', () => {
      it('reminds the student and supervisor once about meetings in the next 24 hours', async () => {
        await User.create({ name: 'Dr. One', email: 'sup1@ppu.edu.ps', password: 'x', role: 'supervisor' })
        await create(sup1(), 3001, { scheduledAt: inHours(5) })
        await create(sup1(), 3002, { scheduledAt: inHours(72) })
        await Notification.deleteMany({})
        expect(await runMeetingReminders()).toBe(2)
        expect(await Notification.countDocuments({ type: 'reminder' })).toBe(2)
        expect(await runMeetingReminders()).toBe(0)
      })
    })
  })
}
