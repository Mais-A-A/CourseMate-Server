export type Lang = 'ar' | 'en'

const ENTITIES: Record<string, string> = {
  'academic plan': 'الخطة الأكاديمية',
  'academic plans': 'الخطط الأكاديمية',
  'academic rule': 'القاعدة الأكاديمية',
  'academic rules': 'القواعد الأكاديمية',
  'academic warning': 'الإنذار الأكاديمي',
  'academic warnings': 'الإنذارات الأكاديمية',
  'ai recommendation': 'توصية الذكاء الاصطناعي',
  'ai recommendations': 'توصيات الذكاء الاصطناعي',
  course: 'المقرر',
  courses: 'المقررات',
  'course section': 'شعبة المقرر',
  'course sections': 'شعب المقررات',
  department: 'القسم',
  departments: 'الأقسام',
  schedule: 'الجدول',
  schedules: 'الجداول',
  notification: 'الإشعار',
  notifications: 'الإشعارات',
  user: 'المستخدم',
  users: 'المستخدمين',
  document: 'المستند',
  documents: 'المستندات',
  'important date': 'التاريخ المهم',
  note: 'الملاحظة',
  job: 'المهمة',
  session: 'الجلسة',
  student: 'الطالب',
  file: 'الملف',
}

const ACTIONS: Record<string, string> = {
  create: 'إنشاء',
  fetch: 'جلب',
  update: 'تحديث',
  delete: 'حذف',
  resolve: 'إغلاق',
  get: 'جلب',
  list: 'عرض',
  retrieve: 'استرجاع',
}

const GERUNDS: Record<string, string> = {
  creating: 'إنشاء',
  fetching: 'جلب',
  updating: 'تحديث',
  deleting: 'حذف',
}

const EXACT: Record<string, string> = {
  'Something went wrong. Please try again.': 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
  'Internal Server Error': 'خطأ داخلي في الخادم',
  'Invalid JSON in request body': 'صيغة JSON في الطلب غير صالحة',
  Unauthorized: 'غير مصرح',
  Forbidden: 'ممنوع الوصول',
  'You must be logged in to access this resource': 'يجب تسجيل الدخول للوصول إلى هذا المورد',
  'You are not authorized to access this resource': 'غير مصرح لك بالوصول إلى هذا المورد',
  'Session expired, please log in again': 'انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى',
  'Logged out successfully': 'تم تسجيل الخروج بنجاح',
  'Invalid or expired code': 'الرمز غير صالح أو منتهي الصلاحية',
  'Email is not a university email': 'البريد الإلكتروني ليس بريداً جامعياً',
  'No email found in Google profile': 'لم يتم العثور على بريد إلكتروني في حساب Google',
  'Email query parameter is required': 'معامل البريد الإلكتروني مطلوب',
  'Supervisor email query parameter is required': 'معامل بريد المشرف الإلكتروني مطلوب',
  'No users found for the given supervisor email ': 'لم يتم العثور على مستخدمين لبريد المشرف المحدد',
  'You can only view your own students': 'يمكنك عرض طلابك فقط',
  'Invalid student number': 'الرقم الجامعي غير صالح',
  'Invalid date format': 'صيغة التاريخ غير صالحة',
  'Message is empty': 'الرسالة فارغة',
  'No file uploaded': 'لم يتم رفع أي ملف',
  'Only PDF files are allowed': 'يُسمح بملفات PDF فقط',
  'Invalid PDF file': 'ملف PDF غير صالح',
  'File not available': 'الملف غير متاح',
  'Document received, processing in background': 'تم استلام المستند، وتجري معالجته في الخلفية',
  'Schedule has problems': 'الجدول يحتوي على مشاكل',
  'Meeting not found': 'الموعد غير موجود',
  'You already have a meeting at that time': 'لديك موعد آخر في نفس الوقت',
  'scheduledAt must be a date within the next year': 'يجب أن يكون الموعد خلال السنة القادمة',
  'This chat has reached its message limit. Please start a new chat.': 'وصلت هذه المحادثة إلى الحد الأقصى من الرسائل. يرجى بدء محادثة جديدة.',
  'Meeting deleted successfully': 'تم حذف الموعد بنجاح',
  'Nothing to update': 'لا يوجد ما يمكن تحديثه',
  'followUpDate must be within the next 2 years': 'يجب أن يكون تاريخ المتابعة خلال السنتين القادمتين',
  'Provide either studentNos or riskLevel, not both': 'حدد إما أرقام الطلاب أو مستوى الخطر، وليس كليهما',
  'Only the author can edit this note': 'يمكن لكاتب الملاحظة فقط تعديلها',
  'Only the author can delete this note': 'يمكن لكاتب الملاحظة فقط حذفها',
  'Not enough academic data to assess risk.': 'لا تتوفر بيانات أكاديمية كافية لتقييم مستوى الخطر.',
  'No approved schedule found': 'لم يتم العثور على جدول معتمد',
  'No approved schedule found for this student': 'لم يتم العثور على جدول معتمد لهذا الطالب',
  'No pending schedule found': 'لم يتم العثور على جدول قيد الانتظار',
  'studentId, acdYear and semesterNo are required': 'الرقم الجامعي والسنة الأكاديمية ورقم الفصل مطلوبة',
  'Student data is required for users with the student role.': 'بيانات الطالب مطلوبة للمستخدمين بدور طالب.',
  'student_data must not be provided for non-student users.': 'يجب عدم إرسال بيانات الطالب لغير الطلاب.',
  'Student data should not be provided for non-student roles.': 'يجب عدم إرسال بيانات الطالب لغير الطلاب.',
  'All notifications marked as read': 'تم تحديد جميع الإشعارات كمقروءة',
  'All important dates deleted successfully': 'تم حذف جميع التواريخ المهمة بنجاح',
  'Failed to mark all notifications as read': 'فشل تحديد جميع الإشعارات كمقروءة',
  'Failed to mark notification as read': 'فشل تحديد الإشعار كمقروء',
  'Failed to get job status': 'فشل جلب حالة المهمة',
  'Failed to list documents': 'فشل عرض المستندات',
  'Failed to retrieve document': 'فشل استرجاع المستند',
  'Too many attempts. Please wait a minute.': 'محاولات كثيرة جداً. يرجى الانتظار دقيقة.',
  'Too many insight requests. Please try again later.': 'طلبات تحليل كثيرة جداً. يرجى المحاولة لاحقاً.',
  'Too many requests, please try again later.': 'طلبات كثيرة جداً، يرجى المحاولة لاحقاً.',
  'You are sending too many notifications. Please try again later.': 'ترسل إشعارات كثيرة جداً. يرجى المحاولة لاحقاً.',
}

const entity = (s: string) => ENTITIES[s.trim().toLowerCase()]

const PATTERNS: Array<[RegExp, (m: RegExpMatchArray) => string | undefined]> = [
  [/^Failed to (\w+) (.+?)( by warning type| for the specified user)?$/, (m) => {
    const a = ACTIONS[m[1]!.toLowerCase()]
    const e = entity(m[2]!)
    if (!a || !e) return undefined
    const suffix = m[3] ? (m[3].includes('warning type') ? ' حسب نوع الإنذار' : ' للمستخدم المحدد') : ''
    return `فشل ${a} ${e}${suffix}`
  }],
  [/^Error (creating|fetching|updating|deleting) (\w+)$/, (m) => {
    const a = GERUNDS[m[1]!], e = entity(m[2]!)
    return a && e ? `خطأ أثناء ${a} ${e}` : undefined
  }],
  [/^Upload failed: (.*)$/, () => 'فشل رفع الملف'],
  [/^Error fetching analytics$/, () => 'خطأ أثناء جلب التحليلات'],
  [/^(.+?) not found$/, (m) => {
    const e = entity(m[1]!)
    return e ? `${e} غير موجود` : undefined
  }],
  [/^(.+?) deleted successfully$/, (m) => {
    const e = entity(m[1]!)
    return e ? `تم حذف ${e} بنجاح` : undefined
  }],
]

/** Arabic text for a known English server message, or undefined if there is no translation. */
export function translateToArabic(text: string): string | undefined {
  const exact = EXACT[text]
  if (exact) return exact
  for (const [re, fn] of PATTERNS) {
    const m = text.match(re)
    if (m) {
      const out = fn(m)
      if (out) return out
    }
  }
  return undefined
}

export function translate(text: string, lang: Lang): string {
  return lang === 'ar' ? (translateToArabic(text) ?? text) : text
}

/** `?lang=` wins over the Accept-Language header; defaults to English. */
export function resolveLang(queryLang: unknown, header: string | undefined): Lang {
  if (queryLang === 'ar' || queryLang === 'en') return queryLang
  const first = header?.split(',')[0]?.trim().toLowerCase() ?? ''
  return first.startsWith('ar') ? 'ar' : 'en'
}

const TYPES: Record<string, string> = {
  string: 'نص', number: 'رقم', int: 'عدد صحيح', boolean: 'قيمة منطقية', array: 'قائمة',
  object: 'كائن', date: 'تاريخ', undefined: 'لا شيء', null: 'لا شيء', nan: 'رقم غير صالح',
}
const ty = (t: string) => TYPES[t.toLowerCase()] ?? t

const VALIDATION: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/^Invalid input: expected (\w+), received (\w+)$/, (m) => m[2] === 'undefined' ? 'هذا الحقل مطلوب' : `قيمة غير صالحة: المتوقع ${ty(m[1]!)} لكن المستلم ${ty(m[2]!)}`],
  [/^Too small: expected (\w+) to have >=?(\d+) (characters|items|elements)$/, (m) => `قصير جداً: يجب ألا يقل عن ${m[2]} ${m[3] === 'characters' ? 'حرفاً' : 'عناصر'}`],
  [/^Too big: expected (\w+) to have <=?(\d+) (characters|items|elements)$/, (m) => `طويل جداً: يجب ألا يزيد عن ${m[2]} ${m[3] === 'characters' ? 'حرفاً' : 'عناصر'}`],
  [/^Too small: expected (\w+) to be >=?\s*(\S+)$/, (m) => `القيمة صغيرة جداً: يجب ألا تقل عن ${m[2]}`],
  [/^Too big: expected (\w+) to be <=?\s*(\S+)$/, (m) => `القيمة كبيرة جداً: يجب ألا تزيد عن ${m[2]}`],
  [/^Invalid option: expected one of (.+)$/, (m) => `خيار غير صالح: القيم المسموحة هي ${m[1]}`],
  [/^Invalid email address$/, () => 'عنوان البريد الإلكتروني غير صالح'],
  [/^Invalid (string|input)(: .*)?$/, () => 'قيمة غير صالحة'],
  [/^Unrecognized keys?: (.+)$/, (m) => `حقول غير معروفة: ${m[1]}`],
  [/^Invalid ISO datetime$|^Invalid datetime$|^Invalid date$/, () => 'صيغة التاريخ غير صالحة'],
]

/** Arabic text for a Zod validation message (default Zod wording or one of our own messages). */
export function translateValidation(text: string): string {
  const known = translateToArabic(text)
  if (known) return known
  for (const [re, fn] of VALIDATION) {
    const m = text.match(re)
    if (m) return fn(m)
  }
  return text
}
