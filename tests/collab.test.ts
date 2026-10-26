import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import mongoose from 'mongoose'
import request from 'supertest'
import env from '../env.js'
import app from '../app.js'
import { User } from '../src/features/user/user.model.js'
import { Notification } from '../src/features/notification/notification.model.js'
import { SupervisorNote } from '../src/features/supervisor/note.model.js'
import { runFollowUpReminders } from '../src/features/supervisor/reminders.service.js'
import { generateJWT } from '../src/shared/utils/authUtils.js'

const token = (local: string, role: 'student' | 'admin' | 'supervisor', name = local) =>
  `Bearer ${generateJWT({ email: `${local}@ppu.edu.ps`, name, avatar: '', role, studentId: role === 'student' ? local : null })}`
const sup1 = () => token('sup1', 'supervisor', 'Dr. One')
const sup2 = () => token('sup2', 'supervisor', 'Dr. Two')
const admin = () => token('adm1', 'admin', 'Admin')
const stu = (n: number) => token(String(n), 'student')

const mkStudent = (studentNo: number, supervisorEmail: string, gpa: number): Promise<any> =>
  User.create({
    name: `Student ${studentNo}`,
    email: `${studentNo}@ppu.edu`,
    password: 'x',
    role: 'student',
    student_data: { studentNo, gpa, academic_plan: new mongoose.Types.ObjectId(), supervisor: { supervisorEmail } },
  } as any) as any

const inDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString()

if (env.USE_REAL === 'false') {
  describe('Supervisor notes and notifications (HTTP)', () => {
    let s2001: any, s2002: any, s2003: any, sup1Doc: any

    beforeAll(async () => {
      sup1Doc = await User.create({ name: 'Dr. One', email: 'sup1@ppu.edu', password: 'x', role: 'supervisor' })
      await User.create({ name: 'Dr. Two', email: 'sup2@ppu.edu', password: 'x', role: 'supervisor' })
      s2001 = await mkStudent(2001, 'sup1@ppu.edu.ps', 85) // low risk
      s2002 = await mkStudent(2002, 'sup1@ppu.edu', 55) // high risk (under the probation line)
      s2003 = await mkStudent(2003, 'sup2@ppu.edu', 80)
    })

    beforeEach(async () => {
      await SupervisorNote.deleteMany({})
      await Notification.deleteMany({})
      vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    describe('access', () => {
      it('needs login and the supervisor role', async () => {
        expect((await request(app).post('/supervisor/students/2001/notes').set('Authorization', admin()).send({ body: 'x' })).status).toBe(403)
        expect((await request(app).post('/supervisor/students/2001/notes').send({ body: 'x' })).status).toBe(401)
        expect((await request(app).post('/supervisor/students/2001/notes').set('Authorization', stu(2001)).send({ body: 'x' })).status).toBe(403)
        expect((await request(app).get('/supervisor/students/2001/notes').set('Authorization', stu(2001))).status).toBe(403)
        expect((await request(app).post('/supervisor/notify').set('Authorization', stu(2001)).send({ message: 'x', riskLevel: 'high' })).status).toBe(403)
      })
    })

    describe('notes', () => {
      it('lets a supervisor add and list notes for their own student', async () => {
        const created = await request(app).post('/supervisor/students/2001/notes').set('Authorization', sup1()).send({ body: '  Met today, discussed course load  ', type: 'meeting' })
        expect(created.status).toBe(201)
        expect(created.body.data).toMatchObject({ studentNo: 2001, type: 'meeting', body: 'Met today, discussed course load', authorName: 'Dr. One', followUpDone: false })
        const list = await request(app).get('/supervisor/students/2001/notes').set('Authorization', sup1())
        expect(list.body.data).toHaveLength(1)
      })

      it("hides another supervisor's student (404) and rejects admins", async () => {
        expect((await request(app).post('/supervisor/students/2003/notes').set('Authorization', sup1()).send({ body: 'x' })).status).toBe(404)
        expect((await request(app).get('/supervisor/students/2003/notes').set('Authorization', sup1())).status).toBe(404)
        expect((await request(app).post('/supervisor/students/2003/notes').set('Authorization', admin()).send({ body: 'by admin' })).status).toBe(403)
        expect((await request(app).get('/supervisor/students/2003/notes').set('Authorization', sup2())).body.data).toHaveLength(0)
      })

      it('validates input', async () => {
        const post = (b: object) => request(app).post('/supervisor/students/2001/notes').set('Authorization', sup1()).send(b)
        expect((await post({ body: '' })).status).toBe(400)
        expect((await post({ body: 'x'.repeat(2001) })).status).toBe(400)
        expect((await post({ body: 'ok', type: 'secret' })).status).toBe(400)
        expect((await post({ body: 'ok', followUpDate: inDays(900) })).status).toBe(400)
        expect((await post({ body: 'ok', followUpDate: 'not a date' })).status).toBe(400)
        expect((await request(app).post('/supervisor/students/abc/notes').set('Authorization', sup1()).send({ body: 'ok' })).status).toBe(400)
      })

      it('never exposes notes to students through any existing endpoint', async () => {
        await request(app).post('/supervisor/students/2001/notes').set('Authorization', sup1()).send({ body: 'private remark' })
        expect((await request(app).get(`/user/${s2001._id}`).set('Authorization', stu(2001))).text).not.toContain('private remark')
      })

      it('lets the author edit, complete and delete; rejects non-authors and admins', async () => {
        const { body } = await request(app).post('/supervisor/students/2001/notes').set('Authorization', sup1()).send({ body: 'first', followUpDate: inDays(3) })
        const id = body.data._id

        const edited = await request(app).patch(`/supervisor/notes/${id}`).set('Authorization', sup1()).send({ body: 'edited', followUpDone: true })
        expect(edited.status).toBe(200)
        expect(edited.body.data).toMatchObject({ body: 'edited', followUpDone: true })

        // a note by someone else on a student sup1 can see
        const foreign = await SupervisorNote.create({ studentNo: 2001, authorEmail: 'old@ppu.edu.ps', authorName: 'Old', body: 'old note' })
        expect((await request(app).patch(`/supervisor/notes/${foreign._id}`).set('Authorization', sup1()).send({ body: 'hijack' })).status).toBe(403)
        expect((await request(app).delete(`/supervisor/notes/${foreign._id}`).set('Authorization', sup1())).status).toBe(403)
        expect((await request(app).patch(`/supervisor/notes/${foreign._id}`).set('Authorization', admin()).send({ body: 'admin edit' })).status).toBe(403)

        // a supervisor who cannot see the student cannot see the note at all
        expect((await request(app).patch(`/supervisor/notes/${id}`).set('Authorization', sup2()).send({ body: 'x' })).status).toBe(404)

        expect((await request(app).delete(`/supervisor/notes/${id}`).set('Authorization', sup1())).status).toBe(200)
        expect(await SupervisorNote.countDocuments({ _id: id })).toBe(0)
      })

      it('rejects empty patches and malformed ids', async () => {
        const { body } = await request(app).post('/supervisor/students/2001/notes').set('Authorization', sup1()).send({ body: 'n' })
        expect((await request(app).patch(`/supervisor/notes/${body.data._id}`).set('Authorization', sup1()).send({})).status).toBe(400)
        expect((await request(app).patch('/supervisor/notes/not-an-id').set('Authorization', sup1()).send({ body: 'x' })).status).toBe(404)
        expect((await request(app).delete('/supervisor/notes/not-an-id').set('Authorization', sup1())).status).toBe(404)
      })

      it('lists follow-ups: own only, filtered by due/upcoming', async () => {
        await SupervisorNote.create([
          { studentNo: 2001, authorEmail: 'sup1@ppu.edu.ps', authorName: 'Dr. One', body: 'overdue', followUpDate: new Date(Date.now() - 86400000) },
          { studentNo: 2001, authorEmail: 'sup1@ppu.edu.ps', authorName: 'Dr. One', body: 'later', followUpDate: new Date(Date.now() + 5 * 86400000) },
          { studentNo: 2001, authorEmail: 'sup1@ppu.edu.ps', authorName: 'Dr. One', body: 'done', followUpDate: new Date(Date.now() - 86400000), followUpDone: true },
          { studentNo: 2001, authorEmail: 'sup1@ppu.edu.ps', authorName: 'Dr. One', body: 'no date' },
          { studentNo: 2003, authorEmail: 'sup2@ppu.edu.ps', authorName: 'Dr. Two', body: 'someone else', followUpDate: new Date(Date.now() - 1000) },
        ])
        const all = await request(app).get('/supervisor/follow-ups').set('Authorization', sup1())
        expect(all.body.data.map((n: any) => n.body)).toEqual(['overdue', 'later'])
        expect(all.body.data[0].overdue).toBe(true)
        expect(all.body.data[1].overdue).toBe(false)
        expect((await request(app).get('/supervisor/follow-ups?status=due').set('Authorization', sup1())).body.data.map((n: any) => n.body)).toEqual(['overdue'])
        expect((await request(app).get('/supervisor/follow-ups?status=upcoming').set('Authorization', sup1())).body.data.map((n: any) => n.body)).toEqual(['later'])
        expect((await request(app).get('/supervisor/follow-ups').set('Authorization', admin())).status).toBe(403)
        expect((await request(app).get('/supervisor/follow-ups?status=bogus').set('Authorization', sup1())).status).toBe(400)
      })
    })

    describe('follow-up reminders', () => {
      it('notifies the supervisor once when a follow-up falls due', async () => {
        await SupervisorNote.create([
          { studentNo: 2001, authorEmail: 'sup1@ppu.edu.ps', authorName: 'Dr. One', body: 'check on grades', followUpDate: new Date(Date.now() - 1000) },
          { studentNo: 2001, authorEmail: 'sup1@ppu.edu.ps', authorName: 'Dr. One', body: 'future', followUpDate: new Date(Date.now() + 86400000) },
          { studentNo: 2001, authorEmail: 'sup1@ppu.edu.ps', authorName: 'Dr. One', body: 'finished', followUpDate: new Date(Date.now() - 1000), followUpDone: true },
        ])
        expect(await runFollowUpReminders()).toBe(1)
        expect(await runFollowUpReminders()).toBe(0) // not sent twice
        const n: any = await Notification.findOne({ userId: sup1Doc._id }).lean()
        expect(n.type).toBe('reminder')
        expect(n.message).toContain('Student 2001')
        expect(n.message).toContain('check on grades')
        expect(await Notification.countDocuments()).toBe(1)
      })

      it('re-arms the reminder when the date is changed', async () => {
        const { body } = await request(app).post('/supervisor/students/2001/notes').set('Authorization', sup1()).send({ body: 'again', followUpDate: inDays(1) })
        await SupervisorNote.updateOne({ _id: body.data._id }, { followUpDate: new Date(Date.now() - 1000) })
        expect(await runFollowUpReminders()).toBe(1)
        await request(app).patch(`/supervisor/notes/${body.data._id}`).set('Authorization', sup1()).send({ followUpDate: inDays(2) })
        await SupervisorNote.updateOne({ _id: body.data._id }, { followUpDate: new Date(Date.now() - 1000) })
        expect(await runFollowUpReminders()).toBe(1)
      })
    })

    describe('notify one student', () => {
      it('delivers a notification the student can read, showing who sent it', async () => {
        const res = await request(app).post('/supervisor/students/2001/notify').set('Authorization', sup1()).send({ message: 'Please book a meeting', type: 'reminder' })
        expect(res.status).toBe(201)
        expect(res.body.data.sent).toBe(1)

        const mine = await request(app).get(`/notification/user/${s2001._id}`).set('Authorization', stu(2001))
        expect(mine.status).toBe(200)
        expect(mine.body).toHaveLength(1)
        expect(mine.body[0].sentBy).toBeUndefined() // sender's email is not shown to students
        expect(mine.body[0]).toMatchObject({ message: 'Please book a meeting', type: 'reminder', fromName: 'Dr. One', fromRole: 'supervisor', isRead: false })
      })

      it("cannot notify another supervisor's student", async () => {
        expect((await request(app).post('/supervisor/students/2003/notify').set('Authorization', sup1()).send({ message: 'hi' })).status).toBe(404)
        expect(await Notification.countDocuments()).toBe(0)
      })

      it('rejects admins', async () => {
        const res = await request(app).post('/supervisor/students/2003/notify').set('Authorization', admin()).send({ message: 'hello', type: 'academic' })
        expect(res.status).toBe(403)
        expect(await Notification.countDocuments({ userId: s2003._id })).toBe(0)
      })

      it('validates message and type, and strips markup', async () => {
        const post = (b: object) => request(app).post('/supervisor/students/2001/notify').set('Authorization', sup1()).send(b)
        expect((await post({ message: '' })).status).toBe(400)
        expect((await post({ message: 'x'.repeat(256) })).status).toBe(400)
        expect((await post({ message: 'ok', type: 'deadline' })).status).toBe(400) // reserved for the platform
        expect((await post({ message: 'ok', type: 'nonsense' })).status).toBe(400)
        expect((await post({ message: '<script>alert(1)</script>hi' })).status).toBe(201)
        expect((await Notification.findOne().lean())?.message).not.toMatch(/[<>]/)
      })

      it('cannot spoof the sender fields through the body', async () => {
        await request(app).post('/supervisor/students/2001/notify').set('Authorization', sup1()).send({ message: 'hi', fromName: 'The Dean', fromRole: 'admin', sentBy: 'x' })
        const n: any = await Notification.findOne().select('+sentBy').lean()
        expect(n.fromName).toBe('Dr. One')
        expect(n.fromRole).toBe('supervisor')
        expect(n.sentBy).toBe('sup1@ppu.edu.ps')
      })
    })

    describe('notify many students', () => {
      it('sends to the listed students and reports the ones that are not yours', async () => {
        const res = await request(app).post('/supervisor/notify').set('Authorization', sup1()).send({ message: 'Registration opens Monday', studentNos: [2001, 2002, 2003, 9999] })
        expect(res.status).toBe(201)
        expect(res.body.data.sent).toBe(2)
        expect(res.body.data.skippedStudentNos.sort()).toEqual([2003, 9999])
        expect(await Notification.countDocuments({ userId: s2003._id })).toBe(0)
      })

      it('can target everyone at a risk level among your own students', async () => {
        const res = await request(app).post('/supervisor/notify').set('Authorization', sup1()).send({ message: 'Please see me', riskLevel: 'high', type: 'warning' })
        expect(res.body.data.sent).toBe(1)
        expect(await Notification.countDocuments({ userId: s2002._id })).toBe(1)
        expect(await Notification.countDocuments({ userId: s2001._id })).toBe(0)
        expect(await Notification.countDocuments({ userId: s2003._id })).toBe(0)
      })

      it('returns 200 with sent=0 when nobody matches', async () => {
        const res = await request(app).post('/supervisor/notify').set('Authorization', sup2()).send({ message: 'hi', riskLevel: 'high' })
        expect(res.status).toBe(200)
        expect(res.body.data.sent).toBe(0)
      })

      it('requires exactly one of studentNos / riskLevel and respects the size cap', async () => {
        const post = (b: object) => request(app).post('/supervisor/notify').set('Authorization', sup1()).send({ message: 'hi', ...b })
        expect((await post({})).status).toBe(400)
        expect((await post({ studentNos: [2001], riskLevel: 'high' })).status).toBe(400)
        expect((await post({ studentNos: [] })).status).toBe(400)
        expect((await post({ studentNos: Array.from({ length: 201 }, (_, i) => i + 1) })).status).toBe(400)
        expect((await post({ studentNos: [-1] })).status).toBe(400)
      })

      it('rejects admins', async () => {
        const res = await request(app).post('/supervisor/notify').set('Authorization', admin()).send({ message: 'Campus closed', studentNos: [2001, 2003] })
        expect(res.status).toBe(403)
      })
    })

    describe('sent history', () => {
      it('shows what you sent with read status, and nothing from others', async () => {
        await request(app).post('/supervisor/students/2001/notify').set('Authorization', sup1()).send({ message: 'one' })
        await request(app).post('/supervisor/students/2003/notify').set('Authorization', sup2()).send({ message: 'two' })

        let sent = await request(app).get('/supervisor/notifications/sent').set('Authorization', sup1())
        expect(sent.body.data).toHaveLength(1)
        expect(sent.body.data[0]).toMatchObject({ studentNo: 2001, studentName: 'Student 2001', message: 'one', isRead: false })

        const notif: any = await Notification.findOne({ userId: s2001._id }).lean()
        await request(app).put(`/notification/${notif._id}/read`).set('Authorization', stu(2001))
        sent = await request(app).get('/supervisor/notifications/sent').set('Authorization', sup1())
        expect(sent.body.data[0].isRead).toBe(true)
      })
    })
  })
}
