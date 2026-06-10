import type { Request, Response } from 'express'
import { courseSectionService } from './courseSection.service.js'

class CourseSectionController {
  async createCourseSection(req: Request, res: Response) {
    try {
      const section = await courseSectionService.createCourseSection(req.body)
      res.status(201).json(section)
    } catch (error) {
      res.status(500).json({ error: 'Failed to create course section' })
    }
  }

  async getCourseSections(req: Request, res: Response) {
    try {
      const sections = await courseSectionService.getAllCourseSections()
      res.json(sections)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch course sections' })
    }
  }

  async getCourseSectionById(req: Request, res: Response) {
    try {
      const section = await courseSectionService.getCourseSectionById(req.params.id as string)
      if (!section) return res.status(404).json({ error: 'Course section not found' })
      res.json(section)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch course section' })
    }
  }

  async updateCourseSection(req: Request, res: Response) {
    try {
      const section = await courseSectionService.updateCourseSection(req.params.id as string, req.body)
      if (!section) return res.status(404).json({ error: 'Course section not found' })
      res.json(section)
    } catch (error) {
      res.status(500).json({ error: 'Failed to update course section' })
    }
  }

  async deleteCourseSection(req: Request, res: Response) {
    try {
      const section = await courseSectionService.deleteCourseSection(req.params.id as string)
      if (!section) return res.status(404).json({ error: 'Course section not found' })
      res.json({ message: 'Course section deleted successfully' })
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete course section' })
    }
  }
}

export const courseSectionController = new CourseSectionController()
export default courseSectionController