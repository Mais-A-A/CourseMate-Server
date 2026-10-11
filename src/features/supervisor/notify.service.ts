import { User } from '../user/user.model.js'
import { Notification } from '../notification/notification.model.js'
import { sanitizeUserText } from '../../shared/security/promptGuard.js'
import { emailMatcher, listStudents } from './supervisor.service.js'
import type { RiskLevel } from './risk.js'

export const MAX_RECIPIENTS = 200

/** Plain text only: notifications are shown in the student's UI. */
export const cleanNotificationText = (s: string) =>
  sanitizeUserText(s, 255).replace(/[<>]/g, '').trim()

type Sender = { name: string; email: string; role: 'supervisor' }
type Recipient = { _id: unknown; name: string; studentNo: number }

async function recipientsByStudentNo(studentNos: number[], sender: Sender): Promise<Recipient[]> {
  const filter: any = {
    role: 'student',
    'student_data.studentNo': { $in: studentNos },
    'student_data.supervisor.supervisorEmail': emailMatcher(sender.email),
  }
  const users = await User.find(filter).select('name student_data.studentNo').lean()
  return users.map((u: any) => ({ _id: u._id, name: u.name, studentNo: u.student_data.studentNo }))
}

async function recipientsByRisk(level: RiskLevel, sender: Sender): Promise<Recipient[]> {
  const { items } = await listStudents({ supervisorEmail: sender.email, level, limit: MAX_RECIPIENTS })
  return items
    .filter((s) => s.studentNo !== null)
    .map((s) => ({ _id: s._id, name: s.name, studentNo: s.studentNo! }))
}

export type NotifyTarget = { studentNos: number[] } | { riskLevel: RiskLevel }

export async function notifyStudents(args: {
  sender: Sender
  target: NotifyTarget
  message: string
  type: string
}) {
  const { sender, target, message, type } = args
  const text = cleanNotificationText(message)
  if (!text) throw new Error('Message is empty')

  const recipients =
    'studentNos' in target
      ? await recipientsByStudentNo(target.studentNos, sender)
      : await recipientsByRisk(target.riskLevel, sender)

  const found = new Set(recipients.map((r) => r.studentNo))
  const skippedStudentNos = 'studentNos' in target ? target.studentNos.filter((n) => !found.has(n)) : []

  if (recipients.length > 0) {
    await Notification.insertMany(
      recipients.map((r) => ({
        userId: r._id,
        type,
        message: text,
        fromName: sender.name,
        fromRole: sender.role,
        sentBy: sender.email.toLowerCase(),
      })),
    )
  }
  return { sent: recipients.length, skippedStudentNos, recipients: recipients.map((r) => r.studentNo) }
}

export async function listSent(senderEmail: string, limit = 50) {
  const docs = await Notification.find({ sentBy: senderEmail.toLowerCase() })
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 200))
    .lean()
  const users = await User.find({ _id: { $in: docs.map((d) => d.userId) } } as any)
    .select('name student_data.studentNo')
    .lean()
  const byId = new Map(users.map((u: any) => [String(u._id), u]))
  return docs.map((d: any) => {
    const u: any = byId.get(String(d.userId))
    return {
      _id: String(d._id),
      studentNo: u?.student_data?.studentNo ?? null,
      studentName: u?.name ?? null,
      type: d.type,
      message: d.message,
      isRead: d.isRead,
      sentAt: d.createdAt,
    }
  })
}
