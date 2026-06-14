import { academicWarningService } from '../src/features/academic-warning/academicWarning.service.js'
import type { AcademicWarning } from '../src/features/academic-warning/academicWarning.schema.js'
import { describe, it, expect } from 'vitest'
import env from '../env.js'
import request from 'supertest'
import app from '../app.js'
if (env.USE_REAL !== 'true') {
  describe('AcademicWarningService', () => {
    it('should create a new academic warning', async () => {
      const warningData: AcademicWarning = {
        user_id: '69b819c1376ba34dbc403585',
        caption: 'Low GPA',
        value: 'Student has a GPA below 2.0',
      }
      const warning =
        await academicWarningService.createAcademicWarning(warningData)
      expect(warning).toHaveProperty('_id')
      expect(warning.caption).toBe(warningData.caption)
      expect(warning.value).toBe(warningData.value)
    })

    it('should retrieve all academic warnings', async () => {
      const warnings = await academicWarningService.getAllAcademicWarnings()
      expect(Array.isArray(warnings)).toBe(true)
    })
    it('should retrieve academic warnings by user ID', async () => {
      const userId = '69b819c1376ba34dbc403585'
      const warnings =
        await academicWarningService.getAcademicWarningsByUserId(userId)
      expect(Array.isArray(warnings)).toBe(true)
    })

    it('should retrieve an academic warning by ID', async () => {
      const warningData: AcademicWarning = {
        user_id: '69b819c1376ba34dbc403585',
        caption: 'Low GPA',
        value: 'Student has a GPA below 2.0',
      }

      const createdWarning: any =
        await academicWarningService.createAcademicWarning(warningData)
      const retrievedWarning: any =
        await academicWarningService.getAcademicWarningById(
          createdWarning!._id.toString(),
        )
      expect(retrievedWarning).toBeTruthy()
      expect(retrievedWarning!._id.toString()).toBe(
        createdWarning!._id.toString(),
      )
    })
    it('should update an academic warning', async () => {
      const warningData: AcademicWarning = {
        user_id: '69b819c1376ba34dbc403585',
        caption: 'Low GPA',
        value: 'Student has a GPA below 2.0',
      }
      const createdWarning: any =
        await academicWarningService.createAcademicWarning(warningData)
      const updatedData: Partial<AcademicWarning> = {
        value: 'Student has a GPA below 1.5',
      }
      const updatedWarning: any =
        await academicWarningService.updateAcademicWarning(
          createdWarning!._id.toString(),
          updatedData,
        )
      expect(updatedWarning).toBeTruthy()
      expect(updatedWarning!.value).toBe(updatedData.value)
    })
    it('should resolve an academic warning', async () => {
      const warningData: AcademicWarning = {
        user_id: '69b819c1376ba34dbc403585',
        caption: 'Low GPA',
        value: 'Student has a GPA below 2.0',
      }
      const createdWarning: any =
        await academicWarningService.createAcademicWarning(warningData)
      const resolvedWarning: any =
        await academicWarningService.resolveAcademicWarning(
          createdWarning!._id.toString(),
        )
      expect(resolvedWarning).toBeTruthy()
      expect(resolvedWarning!._id.toString()).toBe(
        createdWarning!._id.toString(),
      )
    })
    it('should delete an academic warning', async () => {
      const warningData: AcademicWarning = {
        user_id: '69b819c1376ba34dbc403585',
        caption: 'Low GPA',
        value: 'Student has a GPA below 2.0',
      }
      const createdWarning: any =
        await academicWarningService.createAcademicWarning(warningData)
      const deletedWarning: any =
        await academicWarningService.deleteAcademicWarning(
          createdWarning!._id.toString(),
        )
      expect(deletedWarning).toBeTruthy()
      expect(deletedWarning!._id.toString()).toBe(
        createdWarning!._id.toString(),
      )
    })
  })
} else {
  describe('AcademicWarning Integration tests', () => {
    it('should create a new academic warning', async () => {
      const res = await request(app).post('/academic-warning').send({
        user_id: '69b819c1376ba34dbc403585',
        caption: 'Low GPA',
        value: 'Student has a GPA below 2.0',
      })
      expect(res.status).toBe(201)
      expect(res.body.value).toBe('Student has a GPA below 2.0')
    })
    it('should get academic warnings for a user', async () => {
      const res = await request(app).get(
        '/academic-warning/user/69b819c1376ba34dbc403585',
      )
      expect(res.status).toBe(200)
      expect(res.body.length).toBeGreaterThan(0)
    })
    it('should resolve an academic warning', async () => {
      const warningsRes = await request(app).get(
        '/academic-warning/user/69b819c1376ba34dbc403585',
      )
      const warningId = warningsRes.body[0]?._id
      const res = await request(app).put(
        `/academic-warning/${warningId}/resolve`,
      )
      expect(res.status).toBe(200)
      expect(res.body._id).toBe(warningId)
    })
    it('should delete an academic warning', async () => {
      const warningsRes = await request(app).get(
        '/academic-warning/user/69b819c1376ba34dbc403585',
      )
      const warningId = warningsRes.body[0]?._id
      const res = await request(app).delete(`/academic-warning/${warningId}`)
      expect(res.status).toBe(200)
    })
  })
}
