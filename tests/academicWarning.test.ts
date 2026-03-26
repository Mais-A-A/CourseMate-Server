import { academicWarningService } from '../src/services/academicWarning.service.js'
import type { AcademicWarning } from '../src/schemas/academicWarning.schema.js'
import { describe, it, expect } from 'vitest'
import { userService } from '../src/services/user.service.js'
describe('AcademicWarningService', () => {
  it('should create a new academic warning', async () => {
    const warningData: AcademicWarning = {
      user_id: '69b819c1376ba34dbc403585',
      warning_type: 'Low GPA',
      message: 'Student has a GPA below 2.0',
      is_resolved: false,
    }
    const warning =
      await academicWarningService.createAcademicWarning(warningData)
    expect(warning).toHaveProperty('_id')
    expect(warning.warning_type).toBe(warningData.warning_type)
    expect(warning.message).toBe(warningData.message)
    expect(warning.is_resolved).toBe(warningData.is_resolved)
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
      warning_type: 'Low GPA',
      message: 'Student has a GPA below 2.0',
      is_resolved: false,
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
      warning_type: 'Low GPA',
      message: 'Student has a GPA below 2.0',
      is_resolved: false,
    }
    const createdWarning: any =
      await academicWarningService.createAcademicWarning(warningData)
    const updatedData: Partial<AcademicWarning> = {
      message: 'Student has a GPA below 1.5',
    }
    const updatedWarning: any =
      await academicWarningService.updateAcademicWarning(
        createdWarning!._id.toString(),
        updatedData,
      )
    expect(updatedWarning).toBeTruthy()
    expect(updatedWarning!.message).toBe(updatedData.message)
  })
  it('should resolve an academic warning', async () => {
    const warningData: AcademicWarning = {
      user_id: '69b819c1376ba34dbc403585',
      warning_type: 'Low GPA',
      message: 'Student has a GPA below 2.0',
      is_resolved: false,
    }
    const createdWarning: any =
      await academicWarningService.createAcademicWarning(warningData)
    const resolvedWarning: any =
      await academicWarningService.resolveAcademicWarning(
        createdWarning!._id.toString(),
      )
    expect(resolvedWarning).toBeTruthy()
    expect(resolvedWarning!.is_resolved).toBe(true)
    expect(resolvedWarning!.resolved_at).toBeTruthy()
  })
  it('should delete an academic warning', async () => {
    const warningData: AcademicWarning = {
      user_id: '69b819c1376ba34dbc403585',
      warning_type: 'Low GPA',
      message: 'Student has a GPA below 2.0',
      is_resolved: false,
    }
    const createdWarning: any =
      await academicWarningService.createAcademicWarning(warningData)
    const deletedWarning: any =
      await academicWarningService.deleteAcademicWarning(
        createdWarning!._id.toString(),
      )
    expect(deletedWarning).toBeTruthy()
    expect(deletedWarning!._id.toString()).toBe(createdWarning!._id.toString())
  })
})
