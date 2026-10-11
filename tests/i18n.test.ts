import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import env from '../env.js'
import app from '../app.js'
import { User } from '../src/features/user/user.model.js'
import { translateToArabic, translateValidation, resolveLang } from '../src/shared/i18n/messages.js'
import { generateJWT } from '../src/shared/utils/authUtils.js'

const token = (local: string, role: 'student' | 'admin' | 'supervisor') =>
  `Bearer ${generateJWT({ email: `${local}@ppu.edu.ps`, name: local, avatar: '', role, studentId: role === 'student' ? local : null })}`

describe('translations', () => {
  it('translates fixed messages and the patterned ones', () => {
    expect(translateToArabic('Unauthorized')).toBe('غير مصرح')
    expect(translateToArabic('Course not found')).toBe('المقرر غير موجود')
    expect(translateToArabic('Failed to fetch academic warnings by warning type')).toBe('فشل جلب الإنذارات الأكاديمية حسب نوع الإنذار')
    expect(translateToArabic('Schedule deleted successfully')).toBe('تم حذف الجدول بنجاح')
    expect(translateToArabic('Error updating user')).toBe('خطأ أثناء تحديث المستخدم')
    expect(translateToArabic('Upload failed: boom')).toBe('فشل رفع الملف')
  })
  it('leaves unknown text alone', () => {
    expect(translateToArabic('Some brand new message')).toBeUndefined()
    expect(translateToArabic('Teapot not found')).toBeUndefined()
  })
  it('translates default Zod validation wording', () => {
    expect(translateValidation('Invalid input: expected string, received undefined')).toBe('هذا الحقل مطلوب')
    expect(translateValidation('Invalid email address')).toBe('عنوان البريد الإلكتروني غير صالح')
    expect(translateValidation('Too small: expected number to be >=45')).toContain('45')
    expect(translateValidation('Nothing to update')).toBe('لا يوجد ما يمكن تحديثه')
    expect(translateValidation('weird custom text')).toBe('weird custom text')
  })
  it('picks the language: ?lang= beats Accept-Language, default English', () => {
    expect(resolveLang('ar', 'en')).toBe('ar')
    expect(resolveLang(undefined, 'ar-PS,ar;q=0.9,en;q=0.8')).toBe('ar')
    expect(resolveLang(undefined, 'en-US,en')).toBe('en')
    expect(resolveLang(undefined, undefined)).toBe('en')
    expect(resolveLang('fr', 'fr')).toBe('en')
  })
})

describe('response language (HTTP)', () => {
  it('answers in English by default and in Arabic when asked', async () => {
    const en = await request(app).get('/supervisor/students')
    expect(en.body.message).toBe('Unauthorized')
    expect(en.headers['content-language']).toBe('en')
    const header = await request(app).get('/supervisor/students').set('Accept-Language', 'ar')
    expect(header.body.message).toBe('غير مصرح')
    expect(header.headers['content-language']).toBe('ar')
    const query = await request(app).get('/supervisor/students?lang=ar')
    expect(query.body.message).toBe('غير مصرح')
    const override = await request(app).get('/supervisor/students?lang=en').set('Accept-Language', 'ar')
    expect(override.body.message).toBe('Unauthorized')
  })

  it('translates error and message text on forbidden responses too', async () => {
    const res = await request(app).get('/supervisor/students').set('Authorization', token('adm1', 'admin')).set('Accept-Language', 'ar')
    expect(res.status).toBe(403)
    expect(res.body.message).toBe('غير مصرح لك بالوصول إلى هذا المورد')
  })
})

if (env.USE_REAL === 'false') {
  describe('language preference (HTTP)', () => {
    beforeAll(async () => {
      await User.create({ name: 'Sup', email: 'sup1@ppu.edu', password: 'x', role: 'supervisor' })
    })
    const sup = () => token('sup1', 'supervisor')

    it('defaults to Arabic and can be changed', async () => {
      expect((await request(app).get('/user/me/language').set('Authorization', sup())).body).toEqual({ language: 'ar' })
      const put = await request(app).put('/user/me/language').set('Authorization', sup()).send({ language: 'en' })
      expect(put.status).toBe(200)
      expect((await request(app).get('/user/me/language').set('Authorization', sup())).body.language).toBe('en')
    })

    it('requires login and a valid language, with Arabic validation errors on request', async () => {
      expect((await request(app).get('/user/me/language')).status).toBe(401)
      const bad = await request(app).put('/user/me/language').set('Authorization', sup()).set('Accept-Language', 'ar').send({ language: 'fr' })
      expect(bad.status).toBe(400)
      expect(bad.body.error.fieldErrors.language[0]).toMatch(/[؀-ۿ]/)
      const missing = await request(app).put('/user/me/language').set('Authorization', sup()).set('Accept-Language', 'ar').send({})
      expect(missing.body.error.fieldErrors.language[0]).toContain('خيار غير صالح')
    })

    it('404s for a user that does not exist', async () => {
      expect((await request(app).get('/user/me/language').set('Authorization', token('ghost', 'supervisor'))).status).toBe(404)
    })
  })
}
