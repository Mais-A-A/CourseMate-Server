// Points a few students at a supervisor email so the supervisor views can be tested.
//   dry run : node dist/src/scripts/assignTestStudents.js <email> [count]
//   apply   : node dist/src/scripts/assignTestStudents.js <email> [count] --apply   (writes a backup file first)
//   restore : node dist/src/scripts/assignTestStudents.js --restore <backup.json>
import 'dotenv/config'
import fs from 'node:fs'
import mongoose from 'mongoose'
import { connectDatabase } from '../config/db.js'
import { User } from '../features/user/user.model.js'

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const restoreIdx = args.indexOf('--restore')
const positional = args.filter((a, i) => !a.startsWith('--') && (restoreIdx === -1 || i !== restoreIdx + 1))

async function restore(file: string) {
  const backup: { _id: string; supervisor: unknown }[] = JSON.parse(fs.readFileSync(file, 'utf8'))
  for (const b of backup) {
    await User.updateOne(
      { _id: b._id },
      b.supervisor ? { $set: { 'student_data.supervisor': b.supervisor } } : { $unset: { 'student_data.supervisor': '' } },
    )
  }
  console.log(`Restored ${backup.length} students from ${file}`)
}

async function main() {
  await connectDatabase()
  if (restoreIdx !== -1) return restore(args[restoreIdx + 1]!)

  const [email, countArg] = positional
  if (!email?.includes('@')) throw new Error('Usage: assignTestStudents <supervisor-email> [count] [--apply]')
  const count = Math.max(1, Number(countArg ?? 8))

  // Spread the picks across the GPA range so the risk levels are mixed
  const students: any[] = await User.find({ role: 'student', 'student_data.studentNo': { $exists: true } })
    .select('name email student_data.studentNo student_data.gpa student_data.supervisor')
    .lean()
  students.sort((a, b) => (a.student_data?.gpa ?? 0) - (b.student_data?.gpa ?? 0))
  const step = Math.max(1, students.length / count)
  const picked = Array.from({ length: Math.min(count, students.length) }, (_, i) => students[Math.floor(i * step)])

  console.log(`${apply ? 'APPLYING' : 'DRY RUN'}: ${picked.length} of ${students.length} students -> ${email}`)
  for (const s of picked) {
    console.log(`  #${s.student_data.studentNo}  gpa ${s.student_data.gpa}  ${s.name}  (current supervisor: ${s.student_data.supervisor?.supervisorEmail ?? 'none'})`)
  }
  if (!apply) return console.log('Nothing changed. Re-run with --apply to write.')

  const file = `supervisor-backup-${Date.now()}.json`
  fs.writeFileSync(file, JSON.stringify(picked.map((s) => ({ _id: String(s._id), supervisor: s.student_data.supervisor ?? null })), null, 2))
  console.log(`Backup written to ${file}`)
  const res = await User.updateMany(
    { _id: { $in: picked.map((s) => s._id) } },
    { $set: { 'student_data.supervisor.supervisorEmail': email } },
  )
  console.log(`Updated ${res.modifiedCount} students`)
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => mongoose.disconnect())
