import { importantDatesService } from '../src/services/importantDates.service.js'
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import type { ImportantDateType } from '../src/schemas/importantDates.schema.js'
if (process.env.USE_REAL !== 'true') {
  describe('Important Dates Unit tests', () => {
    const importnatDate: ImportantDateType = {
      date_name: 'Midterm Exams',
      description: 'Midterm exams for all courses',
      date: new Date('2024-10-15') as unknown as string,
      type: 'deadline',
    }

    it('should create a new important date', async () => {
      const createdDate =
        await importantDatesService.createImportantDate(importnatDate)
      expect(createdDate.date_name).toBe(importnatDate.date_name)
      expect(createdDate.description).toBe(importnatDate.description)
      expect(new Date(createdDate.date!)).toEqual(importnatDate.date)
    })
  })
  it('should retrieve all important dates', async () => {
    const dates = await importantDatesService.getAllImportantDates()
    expect(Array.isArray(dates)).toBe(true)
  })
  it('should update an important date', async () => {
    const dates = await importantDatesService.getAllImportantDates()
    if (dates.length > 0) {
      const dateToUpdate = dates[0]!
      const updatedData: Partial<ImportantDateType> = {
        description: 'Updated description',
      }
      const updatedDate = await importantDatesService.updateImportantDate(
        dateToUpdate?._id.toString(),
        updatedData,
      )
      expect(updatedDate).not.toBeNull()
      expect(updatedDate!.description).toBe(updatedData.description)
    }
  })
  it('should delete an important date', async () => {
    const dates = await importantDatesService.getAllImportantDates()
    if (dates.length > 0) {
      const dateToDelete = dates[0]!
      const deletedDate = await importantDatesService.deleteImportantDate(
        dateToDelete._id.toString(),
      )
      expect(deletedDate).not.toBeNull()
      const checkDeleted = await importantDatesService.getImportantDateById(
        dateToDelete._id.toString(),
      )
      expect(checkDeleted).toBeNull()
    }
  })
}
