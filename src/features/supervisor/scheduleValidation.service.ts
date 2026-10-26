import { CourseSection } from '../course-section/courseSection.model.js'
import { hasTimeConflict, parseSecTime } from '../ai/schedule.generator.js'

export type SectionInput = {
  courseNo: number
  courseName: string
  sectionNo: number
  creditHours: number
  secTime?: string | null | undefined
  roomName?: string | null | undefined
  buildingName?: string | null | undefined
  supervisorName?: string | null | undefined
  capacity?: number | null | undefined
  enrolled?: number | null | undefined
  isOpen?: boolean | undefined
  packageCaption?: string | null | undefined
  reason?: string | undefined
}

export type Issue = { code: string; message: string; messageAr: string; courseNo?: number; sectionNo?: number }

export type ValidationResult = {
  /** Sections rebuilt from the course-section catalogue (time, room, capacity are never trusted from the client) */
  sections: SectionInput[]
  totalCreditHours: number
  errors: Issue[]
  warnings: Issue[]
}

export const MIN_CREDIT_HOURS = Number(process.env.SCHEDULE_MIN_CREDIT_HOURS ?? 12)
export const MAX_CREDIT_HOURS = Number(process.env.SCHEDULE_MAX_CREDIT_HOURS ?? 18)

const label = (s: { courseName: string; sectionNo: number }) => `${s.courseName} (${s.sectionNo})`

/**
 * Checks a schedule against the real course-section data for its semester:
 *  errors   - the section does not exist for that semester, the same course twice, a time overlap,
 *             or a newly added section that is closed / full
 *  warnings - credit hours outside the usual range, an existing section that has since filled up or closed
 * `previous` are the sections already saved, so only NEW sections are blocked for being full.
 */
export async function validateSchedule(
  acdYear: number,
  semesterNo: number,
  sections: SectionInput[],
  previous: { courseNo: number; sectionNo: number }[] = [],
): Promise<ValidationResult> {
  const errors: Issue[] = []
  const warnings: Issue[] = []
  const wasThere = new Set(previous.map((p) => `${p.courseNo}-${p.sectionNo}`))

  const catalogue = await CourseSection.find({
    acdYear,
    semesterNo,
    $or: sections.map((s) => ({ courseNo: s.courseNo, sectionNo: s.sectionNo })),
  }).lean()
  const byKey = new Map(catalogue.map((c) => [`${c.courseNo}-${c.sectionNo}`, c]))

  const rebuilt: SectionInput[] = []
  const seenCourse = new Map<number, SectionInput>()
  for (const s of sections) {
    const key = `${s.courseNo}-${s.sectionNo}`
    const real = byKey.get(key)
    if (!real) {
      errors.push({
        code: 'section_not_found',
        message: `${label(s)} is not offered in ${acdYear}/${semesterNo}`,
        messageAr: `الشعبة ${label(s)} غير متاحة في الفصل ${acdYear}/${semesterNo}`,
        courseNo: s.courseNo,
        sectionNo: s.sectionNo,
      })
      continue
    }
    const section: SectionInput = {
      courseNo: real.courseNo,
      courseName: real.courseName,
      sectionNo: real.sectionNo,
      creditHours: real.courseCredietHrs,
      secTime: real.secTime ?? null,
      roomName: real.roomName ?? null,
      buildingName: real.buildingName ?? null,
      supervisorName: real.supervisorName ?? null,
      capacity: real.capacity ?? null,
      enrolled: real.counter ?? null,
      isOpen: real.isOpen ?? true,
      packageCaption: real.packageCaption ?? null,
      reason: s.reason ?? '',
    }
    rebuilt.push(section)

    const dup = seenCourse.get(section.courseNo)
    if (dup) {
      errors.push({
        code: 'duplicate_course',
        message: `${section.courseName} appears twice (sections ${dup.sectionNo} and ${section.sectionNo})`,
        messageAr: `المساق ${section.courseName} مكرر (الشعبتان ${dup.sectionNo} و ${section.sectionNo})`,
        courseNo: section.courseNo,
        sectionNo: section.sectionNo,
      })
    }
    seenCourse.set(section.courseNo, section)

    const full = section.capacity != null && section.enrolled != null && section.enrolled >= section.capacity
    if (!section.isOpen || full) {
      const issue: Issue = {
        code: full ? 'section_full' : 'section_closed',
        message: `${label(section)} is ${full ? 'full' : 'closed'}`,
        messageAr: `الشعبة ${label(section)} ${full ? 'ممتلئة' : 'مغلقة'}`,
        courseNo: section.courseNo,
        sectionNo: section.sectionNo,
      }
      ;(wasThere.has(key) ? warnings : errors).push(issue)
    }
  }

  // Time overlaps (same rule the generator uses)
  const timed = rebuilt.map((s) => ({ s, t: parseSecTime(s.secTime) })).filter((x) => x.t)
  for (let i = 0; i < timed.length; i++) {
    for (let j = i + 1; j < timed.length; j++) {
      if (hasTimeConflict(timed[i]!.t!, timed[j]!.t!)) {
        const a = timed[i]!.s
        const b = timed[j]!.s
        errors.push({
          code: 'time_conflict',
          message: `${label(a)} overlaps in time with ${label(b)}`,
          messageAr: `الشعبة ${label(a)} تتعارض في الوقت مع ${label(b)}`,
          courseNo: a.courseNo,
          sectionNo: a.sectionNo,
        })
      }
    }
  }

  const totalCreditHours = rebuilt.reduce((sum, s) => sum + s.creditHours, 0)
  if (rebuilt.length > 0 && totalCreditHours > MAX_CREDIT_HOURS) {
    warnings.push({
      code: 'credit_overload',
      message: `${totalCreditHours} credit hours is above the usual maximum of ${MAX_CREDIT_HOURS}`,
      messageAr: `عدد الساعات ${totalCreditHours} يتجاوز الحد المعتاد وهو ${MAX_CREDIT_HOURS}`,
    })
  }
  if (rebuilt.length > 0 && totalCreditHours < MIN_CREDIT_HOURS) {
    warnings.push({
      code: 'credit_underload',
      message: `${totalCreditHours} credit hours is below the usual minimum of ${MIN_CREDIT_HOURS}`,
      messageAr: `عدد الساعات ${totalCreditHours} أقل من الحد المعتاد وهو ${MIN_CREDIT_HOURS}`,
    })
  }

  return { sections: rebuilt, totalCreditHours, errors, warnings }
}
