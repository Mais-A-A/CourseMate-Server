import type { Request, Response } from 'express'
import { courseService } from './course.service.js'

class CourseController {
  async createCourse(req: Request, res: Response) {
    try {
      const course = await courseService.createCourse(req.body)
      res.status(201).json(course)
    } catch (error) {
      res.status(500).json({ error: 'Failed to create course' })
    }
  }

  async getCourses(req: Request, res: Response) {
    try {
      const courses = await courseService.getAllCourses()
      res.json(courses)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch courses' })
    }
  }

  async getCourseById(req: Request, res: Response) {
    try {
      const course = await courseService.getCourseById(req.params.id as string)
      if (!course) return res.status(404).json({ error: 'Course not found' })
      res.json(course)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch course' })
    }
  }

  async updateCourse(req: Request, res: Response) {
    try {
      const course = await courseService.updateCourse(
        req.params.id as string,
        req.body
      )
      if (!course) return res.status(404).json({ error: 'Course not found' })
      res.json(course)
    } catch (error) {
      res.status(500).json({ error: 'Failed to update course' })
    }
  }

  async deleteCourse(req: Request, res: Response) {
    try {
      const course = await courseService.deleteCourse(req.params.id as string)
      if (!course) return res.status(404).json({ error: 'Course not found' })
      res.json({ message: 'Course deleted successfully' })
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete course' })
    }
  }
}

export const courseController = new CourseController()
export default courseController