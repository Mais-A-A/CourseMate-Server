import mongoose from 'mongoose'
import { readFileSync } from 'fs'
import { join } from 'path'
import { connectDatabase } from './config/db.js'
import AcademicPlan from './features/academic-plan/academicPlan.model.js'
import Department from './features/department/department.model.js'
import Course from './features/course/course.model.js'
import CourseSection from './features/course-section/courseSection.model.js'
import User from './features/user/user.model.js'
import Notification from './features/notification/notification.model.js'
import AcademicRule from './features/academic-rule/academicRule.model.js'
import AcademicWarning from './features/academic-warning/academicWarning.model.js'
import Schedule from './features/schedule/schedule.model.js'
import AIRecomendation from './features/ai-recommendation/AIRecomendation.model.js'
import { ImportantDate } from './features/important-dates/importantDates.model.js'
export const seed = async () => {
  await connectDatabase()
  const AcademicPlanModel = AcademicPlan as any
  const ImportantDatesModel = ImportantDate as any
  const DepartmentModel = Department as any
  const CourseModel = Course as any
  const CourseSectionModel = CourseSection as any
  const UserModel = User as any
  const NotificationModel = Notification as any
  const AcademicRuleModel = AcademicRule as any
  const AcademicWarningModel = AcademicWarning as any
  const ScheduleModel = Schedule as any
  const AIRecomendationModel = AIRecomendation as any

  await Promise.all([
    ScheduleModel.deleteMany({}),
    AcademicWarningModel.deleteMany({}),
    NotificationModel.deleteMany({}),
    AIRecomendationModel.deleteMany({}),
    CourseSectionModel.deleteMany({}),
    CourseModel.deleteMany({}),
    DepartmentModel.deleteMany({}),
    UserModel.deleteMany({}),
    AcademicPlanModel.deleteMany({}),
    AcademicRuleModel.deleteMany({}),
  ])

  // ─── Department ────────────────────────────────────────────────────────────
  const department = await DepartmentModel.create({
    department_name: 'Computer Science',
    dean_name: 'Dr. Nizar Sabbah',
  })

  // ─── Courses (from plan PDF – خطة علم الحاسوب 2022) ────────────────────────
  const courseData = [
    // Year 1 – Semester 1
    {
      courseNo: 8239,
      coursesArabicName: 'المهارات الحياتية',
      coursesCreditHours: 2,
      courseLevel: 1,
      courseOrder: 1,
      courseSemester: 1,
      courseYear: 1,
      preCourse: [],
    },
    {
      courseNo: 4001,
      coursesArabicName: 'لغة عربية',
      coursesCreditHours: 3,
      courseLevel: 1,
      courseOrder: 2,
      courseSemester: 1,
      courseYear: 1,
      preCourse: [],
    },
    {
      courseNo: 4004,
      coursesArabicName: 'تفاضل وتكامل 1',
      coursesCreditHours: 3,
      courseLevel: 1,
      courseOrder: 3,
      courseSemester: 1,
      courseYear: 1,
      preCourse: [],
    },
    {
      courseNo: 8996,
      coursesArabicName: 'إنجليزي A2',
      coursesCreditHours: 0,
      courseLevel: 1,
      courseOrder: 4,
      courseSemester: 1,
      courseYear: 1,
      preCourse: [],
    },
    {
      courseNo: 8997,
      coursesArabicName: 'إنجليزي B1',
      coursesCreditHours: 3,
      courseLevel: 1,
      courseOrder: 5,
      courseSemester: 1,
      courseYear: 1,
      preCourse: [8996],
    },
    {
      courseNo: 5055,
      coursesArabicName: 'الحاسوب واساسيات البرمجة',
      coursesCreditHours: 3,
      courseLevel: 1,
      courseOrder: 6,
      courseSemester: 1,
      courseYear: 1,
      preCourse: [],
    },
    {
      courseNo: 5387,
      coursesArabicName: 'كيمياء عامة 1',
      coursesCreditHours: 3,
      courseLevel: 1,
      courseOrder: 7,
      courseSemester: 1,
      courseYear: 1,
      preCourse: [],
    },
    {
      courseNo: 5389,
      coursesArabicName: 'مختبر كيمياء عامة 1',
      coursesCreditHours: 1,
      courseLevel: 1,
      courseOrder: 8,
      courseSemester: 1,
      courseYear: 1,
      preCourse: [5387],
    },
    // Year 1 – Semester 2
    {
      courseNo: 5684,
      coursesArabicName: 'مختبر تطبيقات أنظمة التشغيل',
      coursesCreditHours: 1,
      courseLevel: 2,
      courseOrder: 1,
      courseSemester: 2,
      courseYear: 1,
      preCourse: [5055],
    },
    {
      courseNo: 4076,
      coursesArabicName: 'الرياضيات المتقطعة',
      coursesCreditHours: 3,
      courseLevel: 2,
      courseOrder: 2,
      courseSemester: 2,
      courseYear: 1,
      preCourse: [4004],
    },
    {
      courseNo: 4005,
      coursesArabicName: 'تفاضل وتكامل 2',
      coursesCreditHours: 3,
      courseLevel: 2,
      courseOrder: 3,
      courseSemester: 2,
      courseYear: 1,
      preCourse: [4004],
    },
    {
      courseNo: 8998,
      coursesArabicName: 'إنجليزي B2',
      coursesCreditHours: 3,
      courseLevel: 2,
      courseOrder: 4,
      courseSemester: 2,
      courseYear: 1,
      preCourse: [8997],
    },
    {
      courseNo: 5059,
      coursesArabicName: 'برمجة الحاسوب',
      coursesCreditHours: 3,
      courseLevel: 2,
      courseOrder: 5,
      courseSemester: 2,
      courseYear: 1,
      preCourse: [5055],
    },
    {
      courseNo: 4320,
      coursesArabicName: 'تاريخ فلسطين الحديث',
      coursesCreditHours: 3,
      courseLevel: 2,
      courseOrder: 6,
      courseSemester: 2,
      courseYear: 1,
      preCourse: [],
    },
    {
      courseNo: 8990,
      coursesArabicName: 'مختبر الحاسوب واساسيات البرمجة',
      coursesCreditHours: 1,
      courseLevel: 2,
      courseOrder: 7,
      courseSemester: 2,
      courseYear: 1,
      preCourse: [5055],
    },
    // Year 2 – Semester 3
    {
      courseNo: 5678,
      coursesArabicName: 'المنطق الرقمي',
      coursesCreditHours: 3,
      courseLevel: 3,
      courseOrder: 1,
      courseSemester: 1,
      courseYear: 2,
      preCourse: [4076],
    },
    {
      courseNo: 5050,
      coursesArabicName: 'تركيب البيانات',
      coursesCreditHours: 3,
      courseLevel: 3,
      courseOrder: 2,
      courseSemester: 1,
      courseYear: 2,
      preCourse: [5059],
    },
    {
      courseNo: 5643,
      coursesArabicName: 'أخلاقيات الحاسوب وأمن المعلومات',
      coursesCreditHours: 3,
      courseLevel: 3,
      courseOrder: 3,
      courseSemester: 1,
      courseYear: 2,
      preCourse: [5055],
    },
    {
      courseNo: 4169,
      coursesArabicName: 'جبر خطي 1',
      coursesCreditHours: 3,
      courseLevel: 3,
      courseOrder: 4,
      courseSemester: 1,
      courseYear: 2,
      preCourse: [4004],
    },
    {
      courseNo: 4002,
      coursesArabicName: 'ثقافة اسلامية',
      coursesCreditHours: 3,
      courseLevel: 3,
      courseOrder: 5,
      courseSemester: 1,
      courseYear: 2,
      preCourse: [],
    },
    {
      courseNo: 4308,
      coursesArabicName: 'لغة عبرية',
      coursesCreditHours: 3,
      courseLevel: 3,
      courseOrder: 6,
      courseSemester: 1,
      courseYear: 2,
      preCourse: [],
    },
    // Year 2 – Semester 4
    {
      courseNo: 5193,
      coursesArabicName: 'تحليل عددي',
      coursesCreditHours: 3,
      courseLevel: 4,
      courseOrder: 1,
      courseSemester: 2,
      courseYear: 2,
      preCourse: [4169, 5059],
    },
    {
      courseNo: 8200,
      coursesArabicName: 'الاستخدام الفعال للغة الانجليزية',
      coursesCreditHours: 3,
      courseLevel: 4,
      courseOrder: 2,
      courseSemester: 2,
      courseYear: 2,
      preCourse: [8998],
    },
    {
      courseNo: 5704,
      coursesArabicName: 'تنظيم وعمارة الحاسوب',
      coursesCreditHours: 3,
      courseLevel: 4,
      courseOrder: 3,
      courseSemester: 2,
      courseYear: 2,
      preCourse: [5678],
    },
    {
      courseNo: 5307,
      coursesArabicName: 'برمجة الكيانات',
      coursesCreditHours: 3,
      courseLevel: 4,
      courseOrder: 4,
      courseSemester: 2,
      courseYear: 2,
      preCourse: [5050],
    },
    {
      courseNo: 5270,
      coursesArabicName: 'تصميم وتحليل الخوارزميات',
      coursesCreditHours: 3,
      courseLevel: 4,
      courseOrder: 5,
      courseSemester: 2,
      courseYear: 2,
      preCourse: [5050],
    },
    {
      courseNo: 8999,
      coursesArabicName: 'الريادة',
      coursesCreditHours: 2,
      courseLevel: 4,
      courseOrder: 6,
      courseSemester: 2,
      courseYear: 2,
      preCourse: [],
    },
    // Year 3 – Semester 5
    {
      courseNo: 5999,
      coursesArabicName: 'ادارة واقتصاد',
      coursesCreditHours: 3,
      courseLevel: 5,
      courseOrder: 1,
      courseSemester: 1,
      courseYear: 3,
      preCourse: [],
    },
    {
      courseNo: 5705,
      coursesArabicName: 'نظم التشغيل',
      coursesCreditHours: 3,
      courseLevel: 5,
      courseOrder: 2,
      courseSemester: 1,
      courseYear: 3,
      preCourse: [5704],
    },
    {
      courseNo: 5310,
      coursesArabicName: 'لغات البرمجة',
      coursesCreditHours: 3,
      courseLevel: 5,
      courseOrder: 3,
      courseSemester: 1,
      courseYear: 3,
      preCourse: [5307],
    },
    {
      courseNo: 5268,
      coursesArabicName: 'نظم قواعد البيانات',
      coursesCreditHours: 3,
      courseLevel: 5,
      courseOrder: 4,
      courseSemester: 1,
      courseYear: 3,
      preCourse: [5050],
    },
    {
      courseNo: 4071,
      coursesArabicName: 'الاحتمالات والاحصاء',
      coursesCreditHours: 3,
      courseLevel: 5,
      courseOrder: 5,
      courseSemester: 1,
      courseYear: 3,
      preCourse: [4005],
    },
    {
      courseNo: 5033,
      coursesArabicName: 'تفاعل الإنسان والحاسوب',
      coursesCreditHours: 3,
      courseLevel: 5,
      courseOrder: 6,
      courseSemester: 1,
      courseYear: 3,
      preCourse: [],
    },
    // Year 3 – Semester 6
    {
      courseNo: 5286,
      coursesArabicName: 'برمجة الانترنت',
      coursesCreditHours: 3,
      courseLevel: 6,
      courseOrder: 1,
      courseSemester: 2,
      courseYear: 3,
      preCourse: [5268, 5307],
    },
    {
      courseNo: 4015,
      coursesArabicName: 'أساليب البحث العلمي',
      coursesCreditHours: 2,
      courseLevel: 6,
      courseOrder: 2,
      courseSemester: 2,
      courseYear: 3,
      preCourse: [8998],
    },
    {
      courseNo: 5283,
      coursesArabicName: 'برمجة قواعد البيانات',
      coursesCreditHours: 3,
      courseLevel: 6,
      courseOrder: 3,
      courseSemester: 2,
      courseYear: 3,
      preCourse: [5268],
    },
    {
      courseNo: 5272,
      coursesArabicName: 'مبادئ الذكاء الاصطناعي',
      coursesCreditHours: 3,
      courseLevel: 6,
      courseOrder: 4,
      courseSemester: 2,
      courseYear: 3,
      preCourse: [5270],
    },
    {
      courseNo: 8300,
      coursesArabicName: 'تدريب عملي 1',
      coursesCreditHours: 1,
      courseLevel: 6,
      courseOrder: 5,
      courseSemester: 2,
      courseYear: 3,
      preCourse: [],
    },
    {
      courseNo: 4323,
      coursesArabicName: 'لغة فرنسية',
      coursesCreditHours: 3,
      courseLevel: 6,
      courseOrder: 6,
      courseSemester: 2,
      courseYear: 3,
      preCourse: [],
    },
    // Year 3 – Summer
    {
      courseNo: 4973,
      coursesArabicName: 'التدريب الميداني 1',
      coursesCreditHours: 0,
      courseLevel: 6,
      courseOrder: 7,
      courseSemester: null,
      courseYear: 3,
      preCourse: [],
    },
    // Year 4 – Semester 7
    {
      courseNo: 5706,
      coursesArabicName: 'شبكات الحاسوب',
      coursesCreditHours: 3,
      courseLevel: 7,
      courseOrder: 1,
      courseSemester: 1,
      courseYear: 4,
      preCourse: [5705],
    },
    {
      courseNo: 5273,
      coursesArabicName: 'هندسة البرمجيات',
      coursesCreditHours: 3,
      courseLevel: 7,
      courseOrder: 2,
      courseSemester: 1,
      courseYear: 4,
      preCourse: [5268],
    },
    {
      courseNo: 5311,
      coursesArabicName: 'نظرية الحوسبة',
      coursesCreditHours: 3,
      courseLevel: 7,
      courseOrder: 3,
      courseSemester: 1,
      courseYear: 4,
      preCourse: [5310],
    },
    {
      courseNo: 5703,
      coursesArabicName: 'مقدمة مشروع التخرج',
      coursesCreditHours: 1,
      courseLevel: 7,
      courseOrder: 4,
      courseSemester: 1,
      courseYear: 4,
      preCourse: [5273],
    },
    {
      courseNo: 8442,
      coursesArabicName: 'مختبر هندسة البرمجيات',
      coursesCreditHours: 1,
      courseLevel: 7,
      courseOrder: 5,
      courseSemester: 1,
      courseYear: 4,
      preCourse: [5703],
    },
    // Year 4 – Semester 8
    {
      courseNo: 8301,
      coursesArabicName: 'تدريب عملي 2',
      coursesCreditHours: 1,
      courseLevel: 8,
      courseOrder: 1,
      courseSemester: 2,
      courseYear: 4,
      preCourse: [8300],
    },
    {
      courseNo: 5312,
      coursesArabicName: 'مبادئ المترجمات',
      coursesCreditHours: 3,
      courseLevel: 8,
      courseOrder: 2,
      courseSemester: 2,
      courseYear: 4,
      preCourse: [5311],
    },
    {
      courseNo: 5679,
      coursesArabicName: 'مشروع تخرج',
      coursesCreditHours: 3,
      courseLevel: 8,
      courseOrder: 3,
      courseSemester: 2,
      courseYear: 4,
      preCourse: [5703],
    },
    {
      courseNo: 9000,
      coursesArabicName: 'مساق حر',
      coursesCreditHours: 3,
      courseLevel: 8,
      courseOrder: 4,
      courseSemester: 2,
      courseYear: 4,
      preCourse: [],
    },
  ]
  const courses = await CourseModel.create(
    courseData.map((c: any) => ({ ...c, department_id: department._id })),
  )

  // Helper: find course by courseNo
  const findCourse = (no: number) => courses.find((c: any) => c.courseNo === no)

  // Grade lookup for student 221141
  const gradeMap: Record<number, string> = {
    4002: '98',
    4004: '100',
    4005: '98',
    4071: '100',
    4076: '82',
    4169: '87',
    4308: '99',
    4320: '99',
    4323: '98',
    4973: 'P',
    5033: '99',
    5050: '92',
    5055: '96',
    5059: '99',
    5193: '93',
    5268: '90',
    5270: '93',
    5272: '94',
    5283: '99',
    5286: '93',
    5307: '94',
    5310: '91',
    5387: '97',
    5389: '95',
    5643: '97',
    5678: '98',
    5684: '100',
    5704: '99',
    5705: '97',
    5706: '96',
    5999: '100',
    8200: '97',
    8239: 'P',
    8442: '100',
    8990: '100',
    8996: 'P',
    8997: '96',
    8998: '97',
    8999: '98',
  }

  const toGradeObj = (g: string) => ({
    gradeNGrade: isNaN(Number(g)) ? 0 : Number(g),
    gradeResultGrade: 'P',
    courseTaken: 1,
    gradeCGrade: g,
  })

  const planCourse = (no: number, order: number) => ({
    courseNo: no,
    coursesArabicName:
      courseData.find((c) => c.courseNo === no)?.coursesArabicName ?? '',
    coursesCreditHours:
      courseData.find((c) => c.courseNo === no)?.coursesCreditHours ?? 0,
    courseLevel: courseData.find((c) => c.courseNo === no)?.courseLevel ?? 1,
    courseOrder: order,
    courseSemester:
      courseData.find((c) => c.courseNo === no)?.courseSemester ?? null,
    courseYear: courseData.find((c) => c.courseNo === no)?.courseYear ?? null,
    preCourse: courseData.find((c) => c.courseNo === no)?.preCourse ?? [],
    courseGrades: gradeMap[no] ? [toGradeObj(gradeMap[no])] : [],
  })

  const plan = await AcademicPlanModel.create({
    majorNo: 23103,
    planYear: 2022,
    majorArabicName: 'علم الحاسوب',
    groups: [
      {
        groupArabicName: 'متطلبات الجامعة الإلزامية',
        groupEnglishName: 'University Compulsory Requirements',
        groupNo: 1,
        calcMajorAvg: 0,
        requiredHours: 25,
        passedHours: 22,
        medicineCourses: 0,
        planYear: 2022,
        majorNo: 23103,
        groupCoursList: [
          planCourse(8239, 1),
          planCourse(4001, 2),
          planCourse(4002, 3),
          planCourse(4004, 4),
          planCourse(4005, 5),
          planCourse(4076, 6),
          planCourse(4169, 7),
          planCourse(4320, 8),
          planCourse(8999, 9),
        ],
      },
      {
        groupArabicName: 'متطلبات اللغة والمهارات',
        groupEnglishName: 'Language and Skills Requirements',
        groupNo: 2,
        calcMajorAvg: 0,
        requiredHours: 9,
        passedHours: 9,
        medicineCourses: 0,
        planYear: 2022,
        majorNo: 23103,
        groupCoursList: [
          planCourse(8996, 1),
          planCourse(8997, 2),
          planCourse(8998, 3),
          planCourse(8200, 4),
        ],
      },
      {
        groupArabicName: 'متطلبات التخصص الإلزامية',
        groupEnglishName: 'Major Compulsory Requirements',
        groupNo: 3,
        calcMajorAvg: 1,
        requiredHours: 72,
        passedHours: 63,
        medicineCourses: 0,
        planYear: 2022,
        majorNo: 23103,
        groupCoursList: [
          planCourse(5055, 1),
          planCourse(5684, 2),
          planCourse(8990, 3),
          planCourse(5059, 4),
          planCourse(5678, 5),
          planCourse(5050, 6),
          planCourse(5643, 7),
          planCourse(5704, 8),
          planCourse(5307, 9),
          planCourse(5270, 10),
          planCourse(5193, 11),
          planCourse(4071, 12),
          planCourse(5999, 13),
          planCourse(5705, 14),
          planCourse(5310, 15),
          planCourse(5268, 16),
          planCourse(5286, 17),
          planCourse(5283, 18),
          planCourse(5272, 19),
          planCourse(4015, 20),
          planCourse(5706, 21),
          planCourse(5273, 22),
          planCourse(5311, 23),
          planCourse(5703, 24),
          planCourse(8442, 25),
          planCourse(5312, 26),
          planCourse(5679, 27),
          planCourse(8300, 28),
          planCourse(8301, 29),
        ],
      },
      {
        groupArabicName: 'متطلبات التخصص الاختيارية والحرة',
        groupEnglishName: 'Major Elective and Free Requirements',
        groupNo: 4,
        calcMajorAvg: 0,
        requiredHours: 12,
        passedHours: 10,
        medicineCourses: 0,
        planYear: 2022,
        majorNo: 23103,
        groupCoursList: [
          planCourse(5387, 1),
          planCourse(5389, 2),
          planCourse(4308, 3),
          planCourse(4323, 4),
          planCourse(5033, 5),
          planCourse(4973, 6),
          planCourse(9000, 7),
        ],
      },
    ],
  })

  const dataRoot = join(process.cwd(), 'محمد الجعبري - مشروع')
  const gradesJson = JSON.parse(
    readFileSync(join(dataRoot, 'العلامات', 'العلامات.json'), 'utf-8'),
  ) as { data: Array<{ grades: any[] }> }
  const semestersJson = JSON.parse(
    readFileSync(
      join(dataRoot, 'الوضع الاكاديمي', 'خلاصة الفصول.json'),
      'utf-8',
    ),
  ) as { data: Array<{ semesters: any[] }> }
  const plansJson = JSON.parse(
    readFileSync(
      join(dataRoot, 'الوضع الاكاديمي', 'الخطة الاسترشادية.json'),
      'utf-8',
    ),
  ) as { data: Array<{ groups: any[] }> }
  const levelsJson = JSON.parse(
    readFileSync(
      join(dataRoot, 'الوضع الاكاديمي', 'توزيع المساقات على الفصول.json'),
      'utf-8',
    ),
  ) as { data: Array<{ levels: any[] }> }

  const mapCourse = (c: any) => ({
    courseNo: c.courseNo,
    coursesArabicName: c.coursesArabicName,
    coursesCreditHours: c.coursesCreditHours,
    courseLevel: c.courseLevel ?? 1,
    courseOrder: c.courseOrder ?? 1,
    courseSemester: c.courseSemester ?? null,
    courseYear: c.courseYear ?? null,
    alternativeNo: c.alternativeNo ?? undefined,
    preCourse: (c.preCourse ?? []).map((p: any) =>
      typeof p === 'number' ? p : p.prerequisitesNo,
    ),
    courseGrades: (c.courseGrades ?? []).map((gr: any) => ({
      gradeNGrade: gr.gradeNGrade,
      gradeResultGrade: gr.gradeResultGrade,
      courseTaken: gr.courseTaken,
      gradeCGrade: gr.gradeCGrade,
    })),
  })

  // ─── Step 1: Create one AcademicPlan per student ─────────────────────────
  const studentPlans = await Promise.all(
    plansJson.data.map((planEntry, i) => {
      const groups: any[] = planEntry.groups ?? []
      const levels: any[] = levelsJson.data[i]?.levels ?? []
      return AcademicPlanModel.create({
        majorNo: groups[0]?.majorNo ?? 23103,
        planYear: groups[0]?.planYear ?? 2025,
        majorArabicName: 'علم الحاسوب',
        groups: groups.map((g: any) => ({
          groupArabicName: g.groupArabicName,
          groupEnglishName: g.groupEnglishName ?? '',
          groupNo: g.groupNo,
          calcMajorAvg: !!g.calcMajorAvg,
          requiredHours: g.requiredHours,
          passedHours: g.passedHours,
          medicineCourses: !!g.medicineCourses,
          planYear: g.planYear,
          majorNo: g.majorNo,
          groupCoursList: (g.groupCoursList ?? []).map(mapCourse),
        })),
        levels: levels.map((l: any) => ({
          id: l.id,
          groupArabicName: l.groupArabicName,
          groupEnglishName: l.groupEnglishName ?? undefined,
          requiredHours: l.requiredHours,
          groupCoursList: (l.groupCoursList ?? []).map(mapCourse),
        })),
      })
    }),
  )

  // ─── Step 2: Create 86 student users ─────────────────────────────────────
  const bulkStudents = await Promise.all(
    gradesJson.data.map((entry, i) => {
      const grades: any[] = entry.grades ?? []
      const actualStudentNo: number = grades[0]?.studentNo
      if (!actualStudentNo) return Promise.resolve(null)

      const completedCourses = grades.map((g: any) => ({
        courseNo: g.courseNo,
        courseArabicName: g.courseArabicName,
        academicYear: g.academicYear,
        semesterNo: g.semesterNo,
        creditHours: g.creditHours,
        grade: g.grade,
        weight: g.weight ?? '',
        caption: g.caption ?? '',
      }))

      const numericGrades = completedCourses
        .filter((c) => !isNaN(Number(c.grade)))
        .map((c) => Number(c.grade))

      const gpa = Math.min(
        100,
        Math.max(
          45,
          numericGrades.length > 0
            ? Math.round(
                (numericGrades.reduce((a, b) => a + b, 0) /
                  numericGrades.length) *
                  10,
              ) / 10
            : 70,
        ),
      )

      return UserModel.create({
        name: `طالب ${actualStudentNo}`,
        email: `${actualStudentNo}@ppu.edu`,
        password: 'pass1234',
        role: 'student',
        student_data: {
          studentNo: actualStudentNo,
          gpa,
          academic_plan: studentPlans[i]?._id ?? plan._id,
          supervisor: {
            supervisorNo: 444,
            supervisorArabicName: 'محمد جواد عطا الجعبري',
            supervisorEmail: 'jabary980@ppu.edu',
          },
          notifications: [],
          completed_courses: completedCourses,
        },
      })
    }),
  )

  // ─── Step 3: Create semester schedules for all 86 students ───────────────
  await Promise.all(
    semestersJson.data.map((semEntry, i) => {
      const student = bulkStudents[i]
      if (!student) return Promise.resolve()
      const semesters: any[] = semEntry.semesters ?? []
      if (semesters.length === 0) return Promise.resolve()
      const actualStudentNo: number = semesters[0]?.studentNo
      return ScheduleModel.create(
        semesters.map((s: any) => ({
          student_id: student._id,
          studentNo: actualStudentNo,
          academicYear: s.academicYear,
          academicYearTitle: s.academicYearTitle,
          semesterNo: s.semesterNo,
          semesterTitle: s.semesterTitle,
          semesterHours: s.semesterHours,
          passHours: s.passHours,
          semesterAverage: Number(s.semesterAverage),
          majorAverage: s.majorAverage,
          accumulativeAverage: s.accumulativeAverage,
          academicWarning: String(s.academicWarning),
          academicStatus: s.academicStatus,
        })),
      )
    }),
  )

  // ─── Course Sections (2025 / Semester 1) ─────────────────────────────────
  await CourseSectionModel.create([
    {
      acdYear: 2025,
      semesterNo: 1,
      courseNo: 5273,
      courseName: 'هندسة البرمجيات',
      courseCredietHrs: 3,
      sectionNo: 1,
      labSectionNo: -1,
      roomName: 'A-201',
      buildingName: 'مبنى الحاسوب',
      supervisorName: 'محمد جواد عطا الجعبري',
      capacity: 35,
      counter: 28,
      majorNo: 23103,
      isOpen: true,
      packageCaption: 'A',
      secTime: '08:00_08:50 (الاحد, الثلاثاء, الخميس)',
      collageArabicName: 'تكنولوجيا المعلومات وهندسة الحاسوب',
      majorArabicName: 'علم الحاسوب',
      lSectionNo: '',
    },
    {
      acdYear: 2025,
      semesterNo: 1,
      courseNo: 5311,
      courseName: 'نظرية الحوسبة',
      courseCredietHrs: 3,
      sectionNo: 1,
      labSectionNo: -1,
      roomName: 'B-105',
      buildingName: 'مبنى الحاسوب',
      supervisorName: 'Dr. Samer Arandi',
      capacity: 35,
      counter: 30,
      majorNo: 23103,
      isOpen: true,
      packageCaption: 'A',
      secTime: '10:00_10:50 (الاحد, الثلاثاء, الخميس)',
      collageArabicName: 'تكنولوجيا المعلومات وهندسة الحاسوب',
      majorArabicName: 'علم الحاسوب',
      lSectionNo: '',
    },
    {
      acdYear: 2025,
      semesterNo: 1,
      courseNo: 5703,
      courseName: 'مقدمة مشروع التخرج',
      courseCredietHrs: 1,
      sectionNo: 1,
      labSectionNo: -1,
      roomName: 'A-201',
      buildingName: 'مبنى الحاسوب',
      supervisorName: 'محمد جواد عطا الجعبري',
      capacity: 35,
      counter: 28,
      majorNo: 23103,
      isOpen: true,
      packageCaption: 'A',
      secTime: '12:00_12:50 (الاثنين)',
      collageArabicName: 'تكنولوجيا المعلومات وهندسة الحاسوب',
      majorArabicName: 'علم الحاسوب',
      lSectionNo: '',
    },
    {
      // From Postman collection – real section record
      acdYear: 2025,
      semesterNo: 1,
      courseNo: 4001,
      courseName: 'لغة عربية',
      courseCredietHrs: 3,
      sectionNo: 9,
      labSectionNo: -1,
      roomName: '003 (مدرج بلال عمرو)',
      buildingName: 'وادي الهرية C',
      supervisorName: 'جهاد علي محمد العدرة',
      capacity: 40,
      counter: 0,
      majorNo: 23101,
      isOpen: true,
      packageCaption: 'A',
      secTime: '15:00_15:50 (الاحد, الثلاثاء, الخميس)',
      collageArabicName: 'تكنولوجيا المعلومات وهندسة الحاسوب',
      majorArabicName: 'هندسة أنظمة الحاسوب A',
      lSectionNo: '',
    },
  ])

  const supervisor = await UserModel.create({
    name: 'Mohammad Jawad Al-Jabari',
    email: 'jabary980@ppu.edu',
    password: 'pass1234',
    role: 'supervisor',
  })

  await UserModel.create({
    name: 'Admin User',
    email: 'admin@coursemate.dev',
    password: 'pass1234',
    role: 'admin',
  })

  const student = await UserModel.create({
    name: 'Hasan Mohammad Al-Saafin',
    email: 'hasan@gmail.com',
    password: 'pass1234',
    role: 'student',
    student_data: {
      studentNo: 221141,
      gpa: 95.8,
      academic_plan: plan._id,
      supervisor: {
        supervisorNo: 444,
        supervisorArabicName: 'محمد جواد عطا الجعبري',
        supervisorEmail: 'jabary980@ppu.edu',
      },
      notifications: [],
      // All 39 completed courses from grades API (grades/studentinsemester)
      completed_courses: [
        {
          courseNo: 4002,
          courseArabicName: 'ثقافة اسلامية',
          academicYear: 2022,
          semesterNo: 1,
          creditHours: '3',
          grade: '98',
        },
        {
          courseNo: 4004,
          courseArabicName: 'تفاضل وتكامل 1',
          academicYear: 2022,
          semesterNo: 1,
          creditHours: '3',
          grade: '100',
        },
        {
          courseNo: 4005,
          courseArabicName: 'تفاضل وتكامل 2',
          academicYear: 2022,
          semesterNo: 2,
          creditHours: '3',
          grade: '98',
        },
        {
          courseNo: 4071,
          courseArabicName: 'الاحتمالات والاحصاء',
          academicYear: 2024,
          semesterNo: 1,
          creditHours: '3',
          grade: '100',
        },
        {
          courseNo: 4076,
          courseArabicName: 'الرياضيات المتقطعة',
          academicYear: 2022,
          semesterNo: 2,
          creditHours: '3',
          grade: '82',
        },
        {
          courseNo: 4169,
          courseArabicName: 'جبر خطي 1',
          academicYear: 2023,
          semesterNo: 1,
          creditHours: '3',
          grade: '87',
        },
        {
          courseNo: 4308,
          courseArabicName: 'لغة عبرية',
          academicYear: 2023,
          semesterNo: 1,
          creditHours: '3',
          grade: '99',
        },
        {
          courseNo: 4320,
          courseArabicName: 'تاريخ فلسطين الحديث',
          academicYear: 2022,
          semesterNo: 2,
          creditHours: '3',
          grade: '99',
        },
        {
          courseNo: 4323,
          courseArabicName: 'لغة فرنسية',
          academicYear: 2024,
          semesterNo: 2,
          creditHours: '3',
          grade: '98',
        },
        {
          courseNo: 4973,
          courseArabicName: 'التدريب الميداني 1',
          academicYear: 2024,
          semesterNo: 3,
          creditHours: '0',
          grade: 'P',
        },
        {
          courseNo: 5033,
          courseArabicName: 'تفاعل الإنسان والحاسوب',
          academicYear: 2024,
          semesterNo: 1,
          creditHours: '3',
          grade: '99',
        },
        {
          courseNo: 5050,
          courseArabicName: 'تركيب البيانات',
          academicYear: 2023,
          semesterNo: 1,
          creditHours: '3',
          grade: '92',
        },
        {
          courseNo: 5055,
          courseArabicName: 'الحاسوب واساسيات البرمجة',
          academicYear: 2022,
          semesterNo: 1,
          creditHours: '3',
          grade: '96',
        },
        {
          courseNo: 5059,
          courseArabicName: 'برمجة الحاسوب',
          academicYear: 2022,
          semesterNo: 2,
          creditHours: '3',
          grade: '99',
        },
        {
          courseNo: 5193,
          courseArabicName: 'تحليل عددي',
          academicYear: 2023,
          semesterNo: 2,
          creditHours: '3',
          grade: '93',
        },
        {
          courseNo: 5268,
          courseArabicName: 'نظم قواعد البيانات',
          academicYear: 2024,
          semesterNo: 1,
          creditHours: '3',
          grade: '90',
        },
        {
          courseNo: 5270,
          courseArabicName: 'تصميم وتحليل الخوارزميات',
          academicYear: 2023,
          semesterNo: 2,
          creditHours: '3',
          grade: '93',
        },
        {
          courseNo: 5272,
          courseArabicName: 'مبادئ الذكاء الاصطناعي',
          academicYear: 2024,
          semesterNo: 2,
          creditHours: '3',
          grade: '94',
        },
        {
          courseNo: 5283,
          courseArabicName: 'برمجة قواعد البيانات',
          academicYear: 2024,
          semesterNo: 2,
          creditHours: '3',
          grade: '99',
        },
        {
          courseNo: 5286,
          courseArabicName: 'برمجة الانترنت',
          academicYear: 2024,
          semesterNo: 2,
          creditHours: '3',
          grade: '93',
        },
        {
          courseNo: 5307,
          courseArabicName: 'برمجة الكيانات',
          academicYear: 2023,
          semesterNo: 2,
          creditHours: '3',
          grade: '94',
        },
        {
          courseNo: 5310,
          courseArabicName: 'لغات البرمجة',
          academicYear: 2024,
          semesterNo: 1,
          creditHours: '3',
          grade: '91',
        },
        {
          courseNo: 5387,
          courseArabicName: 'كيمياء عامة 1',
          academicYear: 2022,
          semesterNo: 1,
          creditHours: '3',
          grade: '97',
        },
        {
          courseNo: 5389,
          courseArabicName: 'مختبر كيمياء عامة 1',
          academicYear: 2022,
          semesterNo: 1,
          creditHours: '1',
          grade: '95',
        },
        {
          courseNo: 5643,
          courseArabicName: 'أخلاقيات الحاسوب وأمن المعلومات',
          academicYear: 2023,
          semesterNo: 1,
          creditHours: '3',
          grade: '97',
        },
        {
          courseNo: 5678,
          courseArabicName: 'المنطق الرقمي',
          academicYear: 2023,
          semesterNo: 1,
          creditHours: '3',
          grade: '98',
        },
        {
          courseNo: 5684,
          courseArabicName: 'مختبر تطبيقات أنظمة التشغيل',
          academicYear: 2022,
          semesterNo: 2,
          creditHours: '1',
          grade: '100',
        },
        {
          courseNo: 5704,
          courseArabicName: 'تنظيم وعمارة الحاسوب',
          academicYear: 2023,
          semesterNo: 2,
          creditHours: '3',
          grade: '99',
        },
        {
          courseNo: 5705,
          courseArabicName: 'نظم التشغيل',
          academicYear: 2024,
          semesterNo: 1,
          creditHours: '3',
          grade: '97',
        },
        {
          courseNo: 5706,
          courseArabicName: 'شبكات الحاسوب',
          academicYear: 2024,
          semesterNo: 2,
          creditHours: '3',
          grade: '96',
        },
        {
          courseNo: 5999,
          courseArabicName: 'ادارة واقتصاد',
          academicYear: 2024,
          semesterNo: 1,
          creditHours: '3',
          grade: '100',
        },
        {
          courseNo: 8200,
          courseArabicName: 'الاستخدام الفعال للغة الانجليزية',
          academicYear: 2023,
          semesterNo: 2,
          creditHours: '3',
          grade: '97',
        },
        {
          courseNo: 8239,
          courseArabicName: 'المهارات الحياتية',
          academicYear: 2022,
          semesterNo: 1,
          creditHours: '2',
          grade: 'P',
        },
        {
          courseNo: 8442,
          courseArabicName: 'مختبر هندسة البرمجيات',
          academicYear: 2024,
          semesterNo: 2,
          creditHours: '1',
          grade: '100',
        },
        {
          courseNo: 8990,
          courseArabicName: 'مختبر الحاسوب واساسيات البرمجة',
          academicYear: 2022,
          semesterNo: 2,
          creditHours: '1',
          grade: '100',
        },
        {
          courseNo: 8996,
          courseArabicName: 'إنجليزي A2',
          academicYear: 2022,
          semesterNo: 1,
          creditHours: '0',
          grade: 'P',
        },
        {
          courseNo: 8997,
          courseArabicName: 'إنجليزي B1',
          academicYear: 2022,
          semesterNo: 2,
          creditHours: '3',
          grade: '96',
        },
        {
          courseNo: 8998,
          courseArabicName: 'إنجليزي B2',
          academicYear: 2023,
          semesterNo: 1,
          creditHours: '3',
          grade: '97',
        },
        {
          courseNo: 8999,
          courseArabicName: 'الريادة',
          academicYear: 2023,
          semesterNo: 2,
          creditHours: '2',
          grade: '98',
        },
      ],
    },
  })

  // ─── Notification ───────────────────────────────────────────────────────────
  const notification = await NotificationModel.create({
    userId: student._id,
    type: 'academic',
    message: 'تم تسجيلك في مساق هندسة البرمجيات للفصل الأول 2025.',
    isRead: false,
  })

  await UserModel.updateOne(
    { _id: student._id },
    { $push: { 'student_data.notifications': notification._id } },
  )

  // ─── Academic Rules (PPU Bachelor's Degree Bylaws) ─────────────────────────
  await AcademicRuleModel.create([
    // Academic Load
    {
      rule_type: 'academic_load',
      description:
        'الحد الأقصى للساعات المعتمدة في الفصل الدراسي العادي هو 18 ساعة معتمدة.',
    },
    {
      rule_type: 'academic_load',
      description:
        'الحد الأقصى للساعات المعتمدة في الفصل الصيفي هو 10 ساعات معتمدة.',
    },
    {
      rule_type: 'academic_load',
      description:
        'يمكن رفع الحد الأقصى إلى 21 ساعة في الفصل العادي بموافقة رئيس القسم إذا كان معدل الفصل السابق ومعدله التراكمي 80% فأكثر، أو إذا كانت التخرج مرتبطة بها.',
    },
    {
      rule_type: 'academic_load',
      description:
        'الحد الأدنى للتسجيل في الفصل الدراسي العادي هو 12 ساعة معتمدة.',
    },
    // Study Duration
    {
      rule_type: 'study_duration',
      description:
        'مدة الدراسة لبرامج الهندسة: 4 سنوات كحد أدنى و7 سنوات كحد أقصى.',
    },
    {
      rule_type: 'study_duration',
      description:
        'مدة الدراسة للبرامج غير الهندسية: 3 سنوات كحد أدنى و6 سنوات كحد أقصى.',
    },
    // Attendance
    {
      rule_type: 'attendance',
      description:
        'الغياب المسموح به هو محاضرتان نظريتان أو ما يعادلهما لكل ساعة معتمدة في الفصل الدراسي.',
    },
    {
      rule_type: 'attendance',
      description:
        'يُحرم الطالب الذي يتجاوز حد الغياب المسموح به من الامتحان النهائي ويُعطى صفراً.',
    },
    {
      rule_type: 'attendance',
      description:
        'في حالة أربع غيابات بعذر مقبول، يُسحب الطالب تلقائياً من المساق دون الرسوب.',
    },
    // Withdrawal & Add/Drop
    {
      rule_type: 'withdrawal',
      description: 'خلال الأسبوع الأول: يُسمح بالانسحاب دون خسارة الرسوم.',
    },
    {
      rule_type: 'withdrawal',
      description:
        'من الأسبوع الأول حتى الأسبوع العاشر: يُسجَّل الانسحاب بالرمز "W" ولا يؤثر على المعدل، لكن تُفقد الرسوم.',
    },
    {
      rule_type: 'withdrawal',
      description:
        'بعد الأسبوع العاشر: يُسجَّل الانسحاب بالرمز "WF" (انسحاب بإخفاق) ويُحتسب 45% في المعدل التراكمي.',
    },
    // Deferral
    {
      rule_type: 'deferral',
      description:
        'يحق للطالب تأجيل الدراسة لمدة أقصاها سنتان أكاديميتان إجمالياً (متصلتان أو منفصلتان).',
    },
    {
      rule_type: 'deferral',
      description:
        'لا يحق للطلاب الجدد أو المحوَّلين التأجيل قبل إتمام فصل دراسي كامل.',
    },
    {
      rule_type: 'deferral',
      description: 'مدة التأجيل لا تُحتسب ضمن المدة القصوى للتخرج.',
    },
    // Course Repetition
    {
      rule_type: 'course_repetition',
      description:
        'لا يُسمح بإعادة المساق إذا كانت علامة الطالب فيه 70% أو أكثر.',
    },
    {
      rule_type: 'course_repetition',
      description:
        'عند إعادة مساق راسب، تُحتسب العلامة الجديدة فقط في المعدل التراكمي، وتظهر جميع المحاولات في كشف العلامات.',
    },
    {
      rule_type: 'course_repetition',
      description:
        'تُحتسب الساعات المعتمدة للمساق المُعاد مرة واحدة فقط لمتطلبات التخرج. يُعلَّم الرسوب الأول بـ "1R" والثاني بـ "R2" عند التخرج.',
    },
    // Grading
    {
      rule_type: 'grading',
      description:
        'سلم العلامات: 90-100% ممتاز، 80-89% جيد جداً، 70-79% جيد، 60-69% مقبول، أقل من 60% راسب.',
    },
    {
      rule_type: 'grading',
      description:
        'يشمل التقييم النهائي أعمال الفصل (امتحانان معلَنان على الأقل وتقارير ومشاركة) مضافاً إليها الامتحان النهائي الشامل.',
    },
    {
      rule_type: 'grading',
      description:
        'الغياب عن الامتحان النهائي يُعطي علامة صفر. الغياب عن الامتحانات الجزئية بعذر مقبول يُتيح امتحاناً بديلاً من 90 درجة.',
    },
    {
      rule_type: 'grading',
      description:
        'علامة الـ "I" (غير مكتمل): تُمنح بعذر مقبول، ويجب أداء الامتحان في الأسبوع الأول من الفصل التالي وإلا تحوّلت إلى صفر (45%).',
    },
    {
      rule_type: 'grading',
      description:
        'المعدل الفصلي = مجموع (علامة المساق × الساعات المعتمدة) ÷ مجموع الساعات المعتمدة. المعدل التراكمي يُحسب بنفس الطريقة باستخدام آخر علامة لكل مساق.',
    },
    // Honors Classification
    {
      rule_type: 'honors_classification',
      description:
        'تصنيف التخرج بالمعدل التراكمي: 90% فأكثر امتياز عالٍ (يشترط معدل تخصصي 90%+)، 85-89.9% ممتاز، 78-84.9% جيد جداً، 71-77.9% جيد، 68-70.9% مقبول جيد، 65-67.9% مقبول.',
    },
    // Academic Warning
    {
      rule_type: 'academic_warning',
      description:
        'يُوجَّه تحذير أكاديمي إذا انخفض المعدل التراكمي عن 65% (ما عدا الفصل الأول).',
    },
    {
      rule_type: 'academic_warning',
      description:
        'يُوجَّه تحذير أكاديمي إذا انخفض معدل التخصص عن 70% بعد اجتياز 18 ساعة تخصصية أو أكثر.',
    },
    {
      rule_type: 'academic_warning',
      description:
        'الطالب المُنذَر لا يُسجَّل أكثر من 15 ساعة معتمدة (18 إذا اقتضت التخرج)، ويجب إزالة أسباب الإنذار في الفصل التالي.',
    },
    // Academic Dismissal
    {
      rule_type: 'academic_dismissal',
      description:
        'يُفصل الطالب أكاديمياً إذا لم يُزِل الإنذار بعد فصلين دراسيين، أو إذا لم يُكمل تسجيله في أي فصل، أو إذا تجاوز المدة القصوى للدراسة.',
    },
    {
      rule_type: 'academic_dismissal',
      description:
        'يُفصل الطالب إذا كان معدله في الفصل الأول أقل من 55%، أو إذا انخفض معدله التراكمي عن 55% في أي فصل بعد الأول.',
    },
    {
      rule_type: 'academic_dismissal',
      description:
        'الطالب الذي أتم 80% من خطته وصدر بحقه فصل، يمكنه مواصلة الدراسة إذا كان معدله 65% أو أكثر، على أن يتخرج خلال 3 فصول متتالية.',
    },
    // Graduation Requirements
    {
      rule_type: 'graduation',
      description:
        'شروط التخرج: اجتياز جميع المساقات المطلوبة بعلامة 60% على الأقل لكل منها.',
    },
    {
      rule_type: 'graduation',
      description: 'شروط التخرج: الحصول على معدل تراكمي لا يقل عن 65%.',
    },
    {
      rule_type: 'graduation',
      description: 'شروط التخرج: الحصول على معدل تخصصي لا يقل عن 70%.',
    },
    {
      rule_type: 'graduation',
      description:
        'شروط التخرج: إتمام التدريب الميداني المطلوب وساعات العمل التطوعي المقررة.',
    },
    // Merit Scholarships
    {
      rule_type: 'merit_scholarship',
      description:
        'إعفاء 100% من الرسوم الدراسية: معدل فصلي 95% فأكثر مع اجتياز 15 ساعة معتمدة على الأقل وعدم وجود ملاحظات تأديبية.',
    },
    {
      rule_type: 'merit_scholarship',
      description:
        'إعفاء ثلثَي الرسوم الدراسية: معدل فصلي 90-94.9% مع الشروط ذاتها.',
    },
    {
      rule_type: 'merit_scholarship',
      description:
        'إعفاء 40% من الرسوم الدراسية: معدل فصلي 87-89.9% مع الشروط ذاتها.',
    },
    // Honor Roll
    {
      rule_type: 'honor_roll',
      description:
        'قائمة شرف الرئيس: معدل فصلي 90% فأكثر (وفق شروط منحة الامتياز).',
    },
    {
      rule_type: 'honor_roll',
      description:
        'قائمة شرف العميد: معدل فصلي 87% فأكثر (وفق شروط منحة الامتياز).',
    },
    // Tuition Refund
    {
      rule_type: 'tuition_refund',
      description:
        'سياسة استرداد الرسوم للطلاب الجدد عند الانسحاب: قبل بدء الفصل تُحتجز 20% من القسط ورسوم التسجيل (يُسترد 80%)، في الأسبوع الأول تُحتجز 25% من القسط ورسوم التسجيل، في الأسبوع الثاني تُحتجز 50% من القسط ورسوم التسجيل، بعد أسبوعين لا يُسترد شيء.',
    },
    // Semester structure
    {
      rule_type: 'semester_structure',
      description:
        'الفصل الدراسي العادي يتكون من 16 أسبوعاً دراسياً بما في ذلك مدة الامتحانات. الفصل الصيفي يتكون من 8 أسابيع بما في ذلك الامتحانات.',
    },
    // Capstone Projects
    {
      rule_type: 'capstone_project',
      description:
        'يُمنح الطالب أسبوعين إضافيين بعد امتحانات الفصل لإنهاء مشروع التخرج. المشروع غير المكتمل يُعطى "W" إذا كانت النواقص قابلة للإصلاح في الفصل التالي.',
    },
    // Student Classification by Credit Hours
    {
      rule_type: 'student_classification',
      description:
        'تصنيف الطالب حسب الساعات المعتمدة المنجزة: حتى 33 ساعة = السنة الأولى، 34-67 ساعة = السنة الثانية، 68-101 ساعة = السنة الثالثة، 102-135 ساعة = السنة الرابعة، 136 ساعة فأكثر = السنة الخامسة.',
    },
    // Grade Review
    {
      rule_type: 'grade_review',
      description:
        'يحق للطالب طلب مراجعة علامته خلال ثلاثة أيام من تاريخ إعلان النتائج النهائية بعد دفع رسوم المراجعة.',
    },
    // Substitute Course
    {
      rule_type: 'substitute_course',
      description:
        'يُقدَّم مساق بديل مرة واحدة إذا كان مساق واحد فقط يمنع الطالب من التخرج ولم يُطرح في ذلك الفصل، أو إذا كان المساق المطروح يتعارض مع مساق إلزامي آخر. يوافق العميد على البديل بعد استشارة رئيس القسم.',
    },
    // Academic Dismissal – Extended Causes (7–11)
    {
      rule_type: 'academic_dismissal',
      description:
        'الطالب المفصول لا يحق له الاستمرار في نفس الكلية؛ يجوز له الانتقال إلى كلية أخرى إذا توافرت شروط القبول.',
    },
    {
      rule_type: 'academic_dismissal',
      description:
        'الطالب المفصول بسبب تدني المعدل التخصصي (مع معدل تراكمي 65% فأكثر) يجوز له الانتقال إلى تخصص آخر مرة واحدة فقط إذا استوفى شروط القبول الأصلية.',
    },
    {
      rule_type: 'academic_dismissal',
      description:
        'الطالب المفصول في الفصل الأول (معدل أقل من 55%) يجوز له طلب الاستمرار كـ"مفصول مؤقت" بموافقة العميد العام، بشرط تحقيق معدل تراكمي 65% فأكثر بنهاية الفصل. الفشل يعني الفصل النهائي من الكلية. تُمنح هذه الفرصة مرة واحدة فقط.',
    },
    {
      rule_type: 'academic_dismissal',
      description:
        'طلاب برنامج الجسر المفصولون يجوز لهم الانتقال إلى تخصص آخر مرة واحدة؛ ويُعدّون قد استنفدوا فرصة الفصل المؤقت.',
    },
    {
      rule_type: 'academic_dismissal',
      description:
        'الفصل من تخصص ثالث بعد الفصل من تخصصين سابقين يعني الفصل النهائي من الجامعة.',
    },
    // Parallel System
    {
      rule_type: 'parallel_system',
      description:
        'يُقبل طلاب التعليم الموازي وفق حد أدنى للمعدل التنافسي يُحدده مجلس العمداء سنوياً. الطلاب الذين يحققون معدلاً فصلياً 85% فأكثر مع اجتياز 15 ساعة كحد أدنى يدفعون رسوم الانتظام في الفصل التالي فقط. تسري عليهم جميع الأنظمة الأكاديمية كطلاب الانتظام.',
    },
  ])

  await ScheduleModel.create([
    {
      student_id: student._id,
      studentNo: 221141,
      academicYear: 2022,
      academicYearTitle: '2022/2023',
      semesterNo: 1,
      semesterTitle: 'الأول',
      semesterHours: 15,
      passHours: 15,
      semesterAverage: 97.5,
      majorAverage: 0,
      accumulativeAverage: 97.5,
      academicWarning: '0',
      academicStatus: 'منتظم',
    },
    {
      student_id: student._id,
      studentNo: 221141,
      academicYear: 2022,
      academicYearTitle: '2022/2023',
      semesterNo: 2,
      semesterTitle: 'الثاني',
      semesterHours: 17,
      passHours: 17,
      semesterAverage: 95.4,
      majorAverage: 0,
      accumulativeAverage: 96.3,
      academicWarning: '0',
      academicStatus: 'منتظم',
    },
    {
      student_id: student._id,
      studentNo: 221141,
      academicYear: 2023,
      academicYearTitle: '2023/2024',
      semesterNo: 1,
      semesterTitle: 'الأول',
      semesterHours: 18,
      passHours: 18,
      semesterAverage: 95.0,
      majorAverage: 0,
      accumulativeAverage: 95.8,
      academicWarning: '0',
      academicStatus: 'منتظم',
    },
    {
      student_id: student._id,
      studentNo: 221141,
      academicYear: 2023,
      academicYearTitle: '2023/2024',
      semesterNo: 2,
      semesterTitle: 'الثاني',
      semesterHours: 17,
      passHours: 17,
      semesterAverage: 95.5,
      majorAverage: 99,
      accumulativeAverage: 95.8,
      academicWarning: '0',
      academicStatus: 'منتظم',
    },
    {
      student_id: student._id,
      studentNo: 221141,
      academicYear: 2024,
      academicYearTitle: '2024/2025',
      semesterNo: 1,
      semesterTitle: 'الأول',
      semesterHours: 18,
      passHours: 18,
      semesterAverage: 96.2,
      majorAverage: 95.2,
      accumulativeAverage: 95.8,
      academicWarning: '0',
      academicStatus: 'منتظم',
    },
    {
      student_id: student._id,
      studentNo: 221141,
      academicYear: 2024,
      academicYearTitle: '2024/2025',
      semesterNo: 2,
      semesterTitle: 'الثاني',
      semesterHours: 16,
      passHours: 16,
      semesterAverage: 96.3,
      majorAverage: 95.5,
      accumulativeAverage: 95.8,
      academicWarning: '0',
      academicStatus: 'منتظم',
    },
    {
      student_id: student._id,
      studentNo: 221141,
      academicYear: 2024,
      academicYearTitle: '2024/2025',
      semesterNo: 3,
      semesterTitle: 'الصيفي',
      semesterHours: 0,
      passHours: 0,
      semesterAverage: 0,
      majorAverage: 95.5,
      accumulativeAverage: 95.8,
      academicWarning: '0',
      academicStatus: 'منتظم',
    },
  ])

  // ─── AI Recommendation ─────────────────────────────────────────────────────
  const nextCourses = [5273, 5311, 5703]
    .map((no) => findCourse(no)?._id)
    .filter(Boolean)
  await AIRecomendationModel.create({
    student_id: student._id,
    supervisor_id: supervisor._id,
    courses: nextCourses,
    reason:
      'Based on completed semesters 1–6 and a 95.8 accumulative average, the student is ready for year-4 courses: Software Engineering, Theory of Computation, and Graduation Project Introduction.',
    confidenceScore: 0.95,
  })

  // ─── College Course Sections (برامج الكليات, semester 2 / 2025) ─────────────
  const collegesDir = join(dataRoot, 'برامج الكليات')
  const collegeFiles = [
    'كلية التمريض.json',
    'كلية الدراسات الثنائية.json',
    'كلية الطب .json',
    'كلية العلوم الادارية.json',
    'كلية العلوم الانسانية.json',
    'كلية العلوم التطبيقية.json',
    'كلية الفنون والتصميم.json',
    'كلية المهن.json',
    'كلية الهندسة.json',
    'كلية تكنولوجيا المعلومات.json',
    'كلية طب الاسنان.json',
  ]
  for (const file of collegeFiles) {
    const sections: any[] =
      (JSON.parse(readFileSync(join(collegesDir, file), 'utf-8')) as any)
        .data ?? []
    if (sections.length === 0) continue
    await CourseSectionModel.insertMany(
      sections.map((s: any) => ({
        acdYear: s.acdYear,
        semesterNo: s.semesterNo,
        courseNo: s.courseNo,
        courseName: s.courseName,
        courseCredietHrs: s.courseCredietHrs,
        sectionNo: s.sectionNo,
        labSectionNo: s.labSectionNo ?? -1,
        roomName: s.roomName,
        buildingName: s.buildingName,
        supervisorName: s.supervisorName,
        capacity: s.capacity,
        counter: s.counter ?? 0,
        majorNo: s.majorNo,
        isOpen: s.isOpen ?? true,
        packageCaption: s.packageCaption,
        secTime: s.secTime,
        collageArabicName: s.collageArabicName,
        majorArabicName: s.majorArabicName,
        lSectionNo: s.lSectionNo ?? '',
      })),
    )
  }

  const importantDates = [
    {
      title: 'بداية الفصل الدراسي الثاني 2026',
      date: new Date('2026-02-01'),
      description: 'يبدأ الفصل الدراسي الثاني للعام الأكاديمي 2025/2026.',
    },
    {
      title: 'نهاية فترة إضافة/حذف المساقات',
      date: new Date('2025-02-07'),
      description: 'تنتهي فترة إضافة/حذف المساقات للعام الأكاديمي 2025/2026.',
    },
    {
      title: 'بداية الامتحانات النهائية للفصل الثاني  2026',
      date: new Date('2026-05-21'),
      description:
        'يبدأ الامتحانات النهائية للفصل الدراسي الثاني للعام الأكاديمي 2025/2026.',
    },
    {
      title: 'نهاية الفصل الدراسي الثاني 2026',
      date: new Date('2026-06-12'),
      description: 'تنتهي الفصل الدراسي الثاني للعام الأكاديمي 2025/2026.',
    },
  ]
  await ImportantDatesModel.create(importantDates)
  console.log('Database seeded successfully')
}

seed()
  .then(() => {
    console.log('Seeding completed')
  })
  .catch((error) => {
    console.error('Seeding failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.connection.close()
  })
