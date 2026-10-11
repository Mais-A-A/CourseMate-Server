import { Router } from 'express'
import { supervisorController } from './supervisor.controller.js'
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware.js'
import { collabController } from './collab.controller.js'
import { schedulesController } from './schedules.controller.js'
import { meetingsController } from './meetings.controller.js'
import { assistantController } from './assistant.controller.js'
import { insightsLimiter, notifyLimiter, scheduleLimiter, chatBurstLimiter, chatDailyLimiter } from '../../shared/middlewares/rateLimit.js'

const supervisorRouter = Router()
supervisorRouter.use(requireAuth(), requireRole('supervisor'))

/**
 * @swagger
 * /supervisor/overview:
 *   get:
 *     tags: [Supervisor]
 *     summary: Dashboard summary for the supervisor's students
 *     description: Supervisors see their own students. Admins see all students, or one supervisor's with `supervisorEmail`.
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: supervisorEmail, schema: { type: string }, description: Admin only }
 *     responses:
 *       200:
 *         description: "data: { totalStudents, byRiskLevel{high,medium,low,unknown}, trend{improving,stable,declining,unknown}, averageGpa, studentsWithActiveWarnings, needsAttention[] }"
 */
supervisorRouter.get('/overview', supervisorController.overview)

/**
 * @swagger
 * /supervisor/students:
 *   get:
 *     tags: [Supervisor]
 *     summary: List students with their academic risk
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: level, schema: { type: string, enum: [low, medium, high, unknown] } }
 *       - { in: query, name: q, schema: { type: string }, description: Search name, email or student number }
 *       - { in: query, name: sort, schema: { type: string, enum: [risk, gpa, name], default: risk } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 50, maximum: 200 } }
 *       - { in: query, name: supervisorEmail, schema: { type: string }, description: Admin only }
 *     responses:
 *       200:
 *         description: "data: { items[], page, limit, total, totalPages }"
 */
supervisorRouter.get('/students', supervisorController.students)

/**
 * @swagger
 * /supervisor/students/{studentNo}:
 *   get:
 *     tags: [Supervisor]
 *     summary: Full view of one student (progress, warnings, risk, approved schedule)
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: studentNo, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: "data: { student, risk{score,level,trend,gpa,factors[]}, semesters[], warnings[], approvedSchedule, hasPendingSchedule }"
 *       404:
 *         description: Not found, or not one of the supervisor's students
 */
supervisorRouter.get('/students/:studentNo', supervisorController.student)

/**
 * @swagger
 * /supervisor/students/{studentNo}/insights:
 *   get:
 *     tags: [Supervisor]
 *     summary: AI-written explanation of the student's risk with suggested actions
 *     description: Falls back to rule-based text if the AI is unavailable (`insight.source` is "ai" or "rules"). Results are cached for 1 hour.
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: studentNo, required: true, schema: { type: integer } }
 *       - { in: query, name: lang, schema: { type: string, enum: [ar, en], default: ar } }
 *     responses:
 *       200:
 *         description: "data: { risk, insight{summary, suggestedActions[], source, language, generatedAt} }"
 *       429:
 *         description: Rate limited (20 per hour)
 */
supervisorRouter.get('/students/:studentNo/insights', insightsLimiter, supervisorController.insights)

/**
 * @swagger
 * /supervisor/students/{studentNo}/notes:
 *   get:
 *     tags: [Supervisor]
 *     summary: Advising notes for a student (private to supervisors, never shown to students)
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: studentNo, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: "data: [{ _id, studentNo, type, body, authorName, authorEmail, followUpDate, followUpDone, createdAt, updatedAt }]"
 *   post:
 *     tags: [Supervisor]
 *     summary: Add a note (meeting, advice, follow-up or general), optionally with a follow-up date
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: studentNo, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [body]
 *             properties:
 *               body: { type: string, maxLength: 2000 }
 *               type: { type: string, enum: [general, meeting, advice, follow_up], default: general }
 *               followUpDate: { type: string, format: date-time, description: "A reminder is sent to the author when it arrives" }
 *     responses:
 *       201:
 *         description: Note created
 */
supervisorRouter.get('/students/:studentNo/notes', collabController.listNotes)
supervisorRouter.post('/students/:studentNo/notes', collabController.createNote)

/**
 * @swagger
 * /supervisor/notes/{noteId}:
 *   patch:
 *     tags: [Supervisor]
 *     summary: Edit a note, change its follow-up date, or mark the follow-up done (author only)
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: noteId, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               body: { type: string }
 *               type: { type: string, enum: [general, meeting, advice, follow_up] }
 *               followUpDate: { type: string, format: date-time, nullable: true }
 *               followUpDone: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated
 *       403:
 *         description: Only the author can edit
 *   delete:
 *     tags: [Supervisor]
 *     summary: Delete a note (author only)
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: noteId, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Deleted
 */
supervisorRouter.patch('/notes/:noteId', collabController.updateNote)
supervisorRouter.delete('/notes/:noteId', collabController.deleteNote)

/**
 * @swagger
 * /supervisor/follow-ups:
 *   get:
 *     tags: [Supervisor]
 *     summary: Notes with an open follow-up date, soonest first (your own)
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [due, upcoming, all], default: all } }
 *     responses:
 *       200:
 *         description: "data: [note + overdue:boolean]"
 */
supervisorRouter.get('/follow-ups', collabController.followUps)

/**
 * @swagger
 * /supervisor/students/{studentNo}/notify:
 *   post:
 *     tags: [Supervisor]
 *     summary: Send an in-app notification to one student
 *     description: Shown to the student with the sender's name. Supervisors can only notify their own students.
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: studentNo, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message: { type: string, maxLength: 255 }
 *               type: { type: string, enum: [info, warning, reminder, academic, success], default: info }
 *     responses:
 *       201:
 *         description: "data: { sent: 1 }"
 *       404:
 *         description: Not one of your students
 *       429:
 *         description: Rate limited (30 per hour)
 */
supervisorRouter.post('/students/:studentNo/notify', notifyLimiter, collabController.notifyOne)

/**
 * @swagger
 * /supervisor/notify:
 *   post:
 *     tags: [Supervisor]
 *     summary: Send a notification to several students at once
 *     description: Give either `studentNos` (up to 200) or `riskLevel` (all of your students at that level). Students that are not yours are skipped and reported.
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message: { type: string, maxLength: 255 }
 *               type: { type: string, enum: [info, warning, reminder, academic, success], default: info }
 *               studentNos: { type: array, items: { type: integer }, maxItems: 200 }
 *               riskLevel: { type: string, enum: [low, medium, high, unknown] }
 *     responses:
 *       201:
 *         description: "data: { sent, skippedStudentNos[] }"
 *       200:
 *         description: Nobody matched (sent is 0)
 */
supervisorRouter.post('/notify', notifyLimiter, collabController.notifyMany)

/**
 * @swagger
 * /supervisor/notifications/sent:
 *   get:
 *     tags: [Supervisor]
 *     summary: Notifications you sent recently, with read status
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: limit, schema: { type: integer, default: 50, maximum: 200 } }
 *     responses:
 *       200:
 *         description: "data: [{ _id, studentNo, studentName, type, message, isRead, sentAt }]"
 */
supervisorRouter.get('/notifications/sent', collabController.sent)

/**
 * @swagger
 * /supervisor/students/{studentNo}/schedules:
 *   get:
 *     summary: All schedules (pending and approved) generated for one of your students
 *     tags: [Supervisor]
 *   post:
 *     summary: Generate a schedule for one of your students (saved as pending)
 *     tags: [Supervisor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [acdYear, semesterNo]
 *             properties:
 *               acdYear: { type: integer }
 *               semesterNo: { type: integer, enum: [1, 2, 3] }
 *               preferences: { type: string, maxLength: 500 }
 * /supervisor/students/{studentNo}/schedules/validate:
 *   post:
 *     summary: Dry-run check of edited sections (time conflicts, duplicates, closed/full sections, credit hours). Saves nothing.
 *     tags: [Supervisor]
 * /supervisor/students/{studentNo}/schedules/{scheduleId}:
 *   get:
 *     summary: One schedule
 *     tags: [Supervisor]
 *   patch:
 *     summary: Edit sections / reasoning / warnings (422 with errors[] on conflicts), or approve it with status "approved" (replaces other schedules of that semester)
 *     tags: [Supervisor]
 *   delete:
 *     summary: Delete a schedule
 *     tags: [Supervisor]
 */
supervisorRouter.get('/students/:studentNo/schedules', schedulesController.list)
supervisorRouter.post('/students/:studentNo/schedules', scheduleLimiter, schedulesController.generate)
supervisorRouter.post('/students/:studentNo/schedules/validate', schedulesController.validate)
supervisorRouter.get('/students/:studentNo/schedules/:scheduleId', schedulesController.get)
supervisorRouter.patch('/students/:studentNo/schedules/:scheduleId', schedulesController.update)
supervisorRouter.delete('/students/:studentNo/schedules/:scheduleId', schedulesController.remove)

/**
 * @swagger
 * /supervisor/assistant/chat:
 *   post:
 *     summary: Chat with the supervisor AI assistant (server-sent events). Optional studentNo focuses it on one of your students.
 *     tags: [Supervisor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message, sessionId]
 *             properties:
 *               message: { type: string, maxLength: 1000 }
 *               sessionId: { type: string }
 *               studentNo: { type: integer }
 * /supervisor/assistant/sessions:
 *   get:
 *     summary: Your assistant chats
 *     tags: [Supervisor]
 * /supervisor/assistant/sessions/{sessionId}:
 *   get:
 *     summary: One chat with its messages
 *     tags: [Supervisor]
 *   patch:
 *     summary: Rename a chat
 *     tags: [Supervisor]
 *   delete:
 *     summary: Delete a chat
 *     tags: [Supervisor]
 */
supervisorRouter.post('/assistant/chat', chatBurstLimiter, chatDailyLimiter, assistantController.chat)
supervisorRouter.get('/assistant/sessions', assistantController.sessions)
supervisorRouter.get('/assistant/sessions/:sessionId', assistantController.session)
supervisorRouter.patch('/assistant/sessions/:sessionId', assistantController.rename)
supervisorRouter.delete('/assistant/sessions/:sessionId', assistantController.remove)

/**
 * @swagger
 * /supervisor/students/{studentNo}/meetings:
 *   get:
 *     summary: Your meetings with one student, newest first
 *     tags: [Supervisor]
 *   post:
 *     summary: Schedule an advising meeting (notifies the student; 409 if you already have a meeting at that time)
 *     tags: [Supervisor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scheduledAt]
 *             properties:
 *               scheduledAt: { type: string, format: date-time }
 *               durationMinutes: { type: integer, minimum: 10, maximum: 240, default: 30 }
 *               mode: { type: string, enum: [in_person, online] }
 *               location: { type: string }
 *               agenda: { type: string }
 * /supervisor/meetings:
 *   get:
 *     summary: Your meeting calendar (query - from, to, status, studentNo)
 *     tags: [Supervisor]
 * /supervisor/meetings/{meetingId}:
 *   patch:
 *     summary: Reschedule (notifies the student), cancel, or complete a meeting with outcome, actionItems and optional followUpDate (creates a linked note)
 *     tags: [Supervisor]
 *   delete:
 *     summary: Delete a meeting (notifies the student if it was still upcoming)
 *     tags: [Supervisor]
 * /supervisor/meetings/{meetingId}/prep:
 *   get:
 *     summary: AI talking points for the meeting (query - lang=ar|en). Nothing is saved.
 *     tags: [Supervisor]
 */
supervisorRouter.get('/students/:studentNo/meetings', meetingsController.listForStudent)
supervisorRouter.post('/students/:studentNo/meetings', meetingsController.create)
supervisorRouter.get('/meetings', meetingsController.calendar)
supervisorRouter.patch('/meetings/:meetingId', meetingsController.update)
supervisorRouter.delete('/meetings/:meetingId', meetingsController.remove)
supervisorRouter.get('/meetings/:meetingId/prep', insightsLimiter, meetingsController.prep)

export { supervisorRouter }
export default supervisorRouter
