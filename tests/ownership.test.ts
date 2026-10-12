import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import app from '../app.js'
import env from '../env.js'
import { User } from '../src/features/user/user.model.js'
import { Notification } from '../src/features/notification/notification.model.js'
import { Schedule } from '../src/features/schedule/schedule.model.js'
import { AcademicWarning } from '../src/features/academic-warning/academicWarning.model.js'
import { generateJWT } from '../src/shared/utils/authUtils.js'

const tokenFor = (local: string, role: 'student' | 'admin' | 'supervisor') =>
  generateJWT({
    email: `${local}@ppu.edu.ps`,
    name: local,
    avatar: '',
    role,
    studentId: role === 'student' ? local : null,
  })

const alice = () => `Bearer ${tokenFor('221141', 'student')}`
const bob = () => `Bearer ${tokenFor('222222', 'student')}`
const staff = () => `Bearer ${tokenFor('sup1', 'supervisor')}`
const admin = () => `Bearer ${tokenFor('adm1', 'admin')}`

if (env.USE_REAL === 'false') {
  describe('Ownership checks (HTTP)', () => {
    let aliceId: string
    let notificationId: string
    let scheduleId: string
    let warningId: string

    beforeAll(async () => {
      const a: any = await User.create({ name: 'Alice', email: '221141@ppu.edu', password: 'x', role: 'admin' })
      await User.create({ name: 'Bob', email: '222222@ppu.edu', password: 'x', role: 'admin' })
      aliceId = String(a._id)
      notificationId = String(
        (await (Notification as any).create({ userId: a._id, type: 'info', message: 'hi' }))._id,
      )
      scheduleId = String(
        (await (Schedule as any).create({ student_id: a._id, studentNo: 221141, academicYear: 2025, semesterNo: 1 }))._id,
      )
      warningId = String(
        (await (AcademicWarning as any).create({ user_id: a._id, caption: 'c', value: 'v' }))._id,
      )
    })

    describe('users', () => {
      it('student can read own record, not another student\'s', async () => {
        expect((await request(app).get(`/user/${aliceId}`).set('Authorization', alice())).status).toBe(200)
        expect((await request(app).get(`/user/${aliceId}`).set('Authorization', bob())).status).toBe(403)
      })
      it('user list is admin-only', async () => {
        expect((await request(app).get('/user').set('Authorization', alice())).status).toBe(403)
        expect((await request(app).get('/user').set('Authorization', staff())).status).toBe(403)
        expect((await request(app).get('/user').set('Authorization', admin())).status).toBe(200)
      })
      it('requires login', async () => {
        expect((await request(app).get(`/user/${aliceId}`)).status).toBe(401)
      })
    })

    describe('notifications', () => {
      it('owner can list and read, others cannot', async () => {
        expect((await request(app).get(`/notification/user/${aliceId}`).set('Authorization', alice())).status).toBe(200)
        expect((await request(app).get(`/notification/user/${aliceId}`).set('Authorization', bob())).status).toBe(403)
        expect((await request(app).get(`/notification/${notificationId}`).set('Authorization', bob())).status).toBe(403)
        expect((await request(app).get(`/notification/${notificationId}`).set('Authorization', alice())).status).toBe(200)
      })
      it("others cannot mark-read or delete someone's notification", async () => {
        expect((await request(app).put(`/notification/${notificationId}/read`).set('Authorization', bob())).status).toBe(403)
        expect((await request(app).put(`/notification/user/${aliceId}/read`).set('Authorization', bob())).status).toBe(403)
        expect((await request(app).delete(`/notification/${notificationId}`).set('Authorization', bob())).status).toBe(403)
      })
      it('only admins can create notifications here (supervisors use /supervisor/notify)', async () => {
        const body = { userId: aliceId, type: 'info', message: 'x' }
        expect((await request(app).post('/notification').set('Authorization', alice()).send(body)).status).toBe(403)
        expect((await request(app).post('/notification').set('Authorization', staff()).send(body)).status).toBe(403)
        expect((await request(app).post('/notification').set('Authorization', admin()).send(body)).status).toBe(201)
      })
      it('rejects unknown notification types', async () => {
        const res = await request(app)
          .post('/notification')
          .set('Authorization', admin())
          .send({ userId: aliceId, type: 'nonsense', message: 'x' })
        expect(res.status).toBe(400)
      })
    })

    describe('semester schedules', () => {
      it("owner can read one; others, unrelated supervisors and admins cannot", async () => {
        expect((await request(app).get(`/schedule/${scheduleId}`).set('Authorization', alice())).status).toBe(200)
        expect((await request(app).get(`/schedule/${scheduleId}`).set('Authorization', bob())).status).toBe(403)
        expect((await request(app).get(`/schedule/${scheduleId}`).set('Authorization', staff())).status).toBe(403)
        expect((await request(app).get(`/schedule/${scheduleId}`).set('Authorization', admin())).status).toBe(403)
      })
      it('list is admin-only; writes are admin-only', async () => {
        expect((await request(app).get('/schedule').set('Authorization', alice())).status).toBe(403)
        expect((await request(app).get('/schedule').set('Authorization', staff())).status).toBe(403)
        expect((await request(app).get('/schedule').set('Authorization', admin())).status).toBe(200)
        expect((await request(app).delete(`/schedule/${scheduleId}`).set('Authorization', alice())).status).toBe(403)
        expect((await request(app).delete(`/schedule/${scheduleId}`).set('Authorization', staff())).status).toBe(403)
      })
    })

    describe("a supervisor's own students", () => {
      let carolId: string
      let carolNotification: string
      beforeAll(async () => {
        const c: any = await User.create({
          name: 'Carol',
          email: '333333@ppu.edu',
          password: 'x',
          role: 'student',
          student_data: {
            studentNo: 333333,
            academic_plan: new mongoose.Types.ObjectId(),
            supervisor: { supervisorEmail: 'sup1@ppu.edu' },
          },
        } as any)
        carolId = String(c._id)
        carolNotification = String((await (Notification as any).create({ userId: c._id, type: 'info', message: 'hi' }))._id)
      })
      it("lets the assigned supervisor read their student's data but not other supervisors or admins", async () => {
        const other = `Bearer ${tokenFor('sup2', 'supervisor')}`
        expect((await request(app).get(`/user/${carolId}`).set('Authorization', staff())).status).toBe(200)
        expect((await request(app).get(`/notification/user/${carolId}`).set('Authorization', staff())).status).toBe(200)
        expect((await request(app).get(`/notification/${carolNotification}`).set('Authorization', staff())).status).toBe(200)
        expect((await request(app).get(`/user/${carolId}`).set('Authorization', other)).status).toBe(403)
        expect((await request(app).get(`/user/${carolId}`).set('Authorization', admin())).status).toBe(403)
      })
      it('keeps admins and other supervisors out of the AI schedule endpoints', async () => {
        const other = `Bearer ${tokenFor('sup2', 'supervisor')}`
        expect((await request(app).get('/ai/schedule/student/333333').set('Authorization', other)).status).toBe(403)
        expect((await request(app).get('/ai/schedule/student/333333').set('Authorization', admin())).status).toBe(403)
        expect((await request(app).get('/ai/schedule/student/333333').set('Authorization', staff())).status).toBe(404)
        expect((await request(app).post('/ai/schedule/generate/student').set('Authorization', admin()).send({ studentId: '333333', acdYear: 2025, semesterNo: 1 })).status).toBe(403)
        expect((await request(app).post('/ai/schedule/generate/student').set('Authorization', other).send({ studentId: '333333', acdYear: 2025, semesterNo: 1 })).status).toBe(403)
      })
    })

    describe('academic warnings', () => {
      it('owner can read own warnings, others cannot', async () => {
        expect((await request(app).get(`/academic-warning/user/${aliceId}`).set('Authorization', alice())).status).toBe(200)
        expect((await request(app).get(`/academic-warning/user/${aliceId}`).set('Authorization', bob())).status).toBe(403)
        expect((await request(app).get(`/academic-warning/${warningId}`).set('Authorization', bob())).status).toBe(403)
        expect((await request(app).get(`/academic-warning/${warningId}`).set('Authorization', alice())).status).toBe(200)
      })
      it('list is staff-only', async () => {
        expect((await request(app).get('/academic-warning').set('Authorization', alice())).status).toBe(403)
        expect((await request(app).get('/academic-warning').set('Authorization', admin())).status).toBe(200)
      })
    })

    describe('AI recommendations', () => {
      it('students cannot create recommendations', async () => {
        const res = await request(app)
          .post('/ai-recomendation')
          .set('Authorization', alice())
          .send({ courses: [] })
        expect(res.status).toBe(403)
      })
    })

    describe('AI schedules', () => {
      it("student cannot read another student's AI schedule", async () => {
        expect((await request(app).get('/ai/schedule/student/221141').set('Authorization', bob())).status).toBe(403)
        expect((await request(app).get('/ai/schedule/student/221141').set('Authorization', alice())).status).toBe(404)
      })
      it('generate-for-student is staff-only', async () => {
        const res = await request(app)
          .post('/ai/schedule/generate/student')
          .set('Authorization', alice())
          .send({ studentId: '222222', acdYear: 2025, semesterNo: 1 })
        expect(res.status).toBe(403)
      })
    })

    describe('knowledge base', () => {
      it('upload is admin-only and needs login', async () => {
        expect((await request(app).post('/knowledge-base/upload')).status).toBe(401)
        expect((await request(app).post('/knowledge-base/upload').set('Authorization', alice())).status).toBe(403)
      })
      it('document list needs login', async () => {
        expect((await request(app).get('/knowledge-base/documents')).status).toBe(401)
      })
    })
  })
}
