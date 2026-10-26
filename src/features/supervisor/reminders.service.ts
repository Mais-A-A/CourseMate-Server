import { SupervisorNote } from './note.model.js'
import { User } from '../user/user.model.js'
import { Notification } from '../notification/notification.model.js'
import { emailMatcher } from './supervisor.service.js'
import { Meeting } from './meeting.model.js'

/** Creates an in-app reminder for each supervisor note whose follow-up date has arrived. Safe to run repeatedly. */
export async function runFollowUpReminders(now = new Date()): Promise<number> {
  const due = await SupervisorNote.find({
    followUpDone: false,
    reminderSent: false,
    followUpDate: { $ne: null, $lte: now },
  })
    .limit(500)
    .lean()
  let created = 0
  for (const note of due) {
    // Claim the note first so two server instances can't both send the reminder
    const claimed = await SupervisorNote.updateOne({ _id: note._id, reminderSent: false }, { reminderSent: true })
    if (claimed.modifiedCount === 0) continue

    const supervisor: any = await User.findOne({ email: emailMatcher(note.authorEmail), role: { $in: ['supervisor', 'admin'] } })
      .select('_id preferredLanguage')
      .lean()
    if (!supervisor) continue
    const student: any = await User.findOne({ 'student_data.studentNo': note.studentNo }).select('name').lean()
    const snippet = note.body.replace(/\s+/g, ' ').slice(0, 120)
    await Notification.create({
      userId: supervisor._id,
      type: 'reminder',
      message: `${supervisor.preferredLanguage === 'en' ? 'Follow-up due' : 'موعد متابعة'}: ${student?.name ?? note.studentNo} (${note.studentNo}) - ${snippet}`.slice(0, 255),
    })
    created++
  }
  return created
}

/** Reminds the student (and the supervisor) about meetings starting within the next 24 hours. */
export async function runMeetingReminders(now = new Date()): Promise<number> {
  const due = await Meeting.find({
    status: 'scheduled',
    reminderSent: false,
    scheduledAt: { $gt: now, $lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
  })
    .limit(500)
    .lean()
  let created = 0
  for (const m of due) {
    const claimed = await Meeting.updateOne({ _id: m._id, reminderSent: false }, { reminderSent: true })
    if (claimed.modifiedCount === 0) continue
    const [student, supervisor]: any[] = await Promise.all([
      User.findOne({ 'student_data.studentNo': m.studentNo }).select('_id name preferredLanguage').lean(),
      User.findOne({ email: emailMatcher(m.supervisorEmail) }).select('_id preferredLanguage').lean(),
    ])
    const fmt = (lang: string) =>
      m.scheduledAt.toLocaleString(lang === 'en' ? 'en-GB' : 'ar', { timeZone: 'Asia/Hebron', dateStyle: 'full', timeStyle: 'short' })
    if (student) {
      const en = student.preferredLanguage === 'en'
      await Notification.create({
        userId: student._id,
        type: 'reminder',
        message: (en ? `Reminder: advising meeting with ${m.supervisorName} - ${fmt('en')}` : `تذكير: موعد الإرشاد الأكاديمي مع ${m.supervisorName} - ${fmt('ar')}`).slice(0, 255),
        fromName: m.supervisorName,
        fromRole: 'supervisor',
        sentBy: m.supervisorEmail,
      })
      created++
    }
    if (supervisor) {
      const en = supervisor.preferredLanguage === 'en'
      await Notification.create({
        userId: supervisor._id,
        type: 'reminder',
        message: (en ? `Upcoming meeting with ${student?.name ?? m.studentNo} (${m.studentNo}) - ${fmt('en')}` : `موعد قادم مع ${student?.name ?? m.studentNo} (${m.studentNo}) - ${fmt('ar')}`).slice(0, 255),
      })
      created++
    }
  }
  return created
}

const INTERVAL_MS = 30 * 60 * 1000

export function startFollowUpReminders() {
  const run = () =>
    Promise.all([
      runFollowUpReminders().catch((e) => console.error('[Reminders] follow-up run failed:', e)),
      runMeetingReminders().catch((e) => console.error('[Reminders] meeting run failed:', e)),
    ])
  setTimeout(run, 60_000).unref()
  setInterval(run, INTERVAL_MS).unref()
}
