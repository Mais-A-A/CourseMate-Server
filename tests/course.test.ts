import { courseService } from '../src/services/course.service.js'
import type { Course } from '../src/schemas/course.schema.js'
import { describe, it, expect } from 'vitest'
import env from '../env.js'
import request from 'supertest'
import app from '../app.js'

const level: Course['diffeculty_level'] = 'moderate'

if (env.USE_REAL !== 'true') {
  describe('CourseService', () => {
    it('should create a new course', async () => {
      const courseData: Course = {
        course_code: 'CS101',
        title: 'Intro to CS',
        credits: 3,
        department_id: '64a5c1b1f1a2b3c4d5e6f789',
        diffeculty_level: level,
        plan_id: '64a5c1b1f1a2b3c4d5e6f788',
        estimated: 120,
      }

      const course = await courseService.createCourse(courseData)

      expect(course).toHaveProperty('_id')
      expect(course.title).toBe(courseData.title)
      expect(course.course_code).toBe(courseData.course_code)
    })

    it('should retrieve all courses', async () => {
      const courses = await courseService.getAllCourses()
      expect(Array.isArray(courses)).toBe(true)
    })

    it('should retrieve a course by ID', async () => {
      const courseData: Course = {
        course_code: 'CS102',
        title: 'Data Structures',
        credits: 3,
        department_id: '64a5c1b1f1a2b3c4d5e6f789',
        diffeculty_level: level,
        plan_id: '64a5c1b1f1a2b3c4d5e6f788',
        estimated: 100,
      }

      const created: any = await courseService.createCourse(courseData)

      const retrieved: any = await courseService.getCourseById(
        created._id.toString(),
      )

      expect(retrieved).toBeTruthy()
      expect(retrieved!._id.toString()).toBe(created._id.toString())
    })

    it('should update a course', async () => {
      const courseData: Course = {
        course_code: 'CS103',
        title: 'Algorithms',
        credits: 3,
        department_id: '64a5c1b1f1a2b3c4d5e6f789',
        diffeculty_level: level,
        plan_id: '64a5c1b1f1a2b3c4d5e6f788',
        estimated: 90,
      }

      const created: any = await courseService.createCourse(courseData)

      const updated: any = await courseService.updateCourse(
        created._id.toString(),
        { title: 'Advanced Algorithms' },
      )

      expect(updated).toBeTruthy()
      expect(updated!.title).toBe('Advanced Algorithms')
    })

    it('should delete a course', async () => {
      const courseData: Course = {
        course_code: 'CS104',
        title: 'Databases',
        credits: 3,
        department_id: '64a5c1b1f1a2b3c4d5e6f789',
        diffeculty_level: level,
        plan_id: '64a5c1b1f1a2b3c4d5e6f788',
        estimated: 110,
      }

      const created: any = await courseService.createCourse(courseData)

      const deleted: any = await courseService.deleteCourse(
        created._id.toString(),
      )

      expect(deleted).toBeTruthy()
      expect(deleted!._id.toString()).toBe(created._id.toString())
    })
  })
} else {
  describe('Course Integration tests', () => {
    it('should create a new course', async () => {
      const res = await request(app).post('/courses').send({
        course_code: 'CS101',
        title: 'Intro to CS',
        credits: 3,
        department_id: '64a5c1b1f1a2b3c4d5e6f789',
        diffeculty_level: level,
        plan_id: '64a5c1b1f1a2b3c4d5e6f788',
        estimated: 120,
      })

      expect(res.status).toBe(201)
      expect(res.body.title).toBe('Intro to CS')
    })

    it('should get all courses', async () => {
      const res = await request(app).get('/courses')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('should update a course', async () => {
      const coursesRes = await request(app).get('/courses')
      const courseId = coursesRes.body[0]?._id

      const res = await request(app)
        .put(`/courses/${courseId}`)
        .send({ title: 'Updated Course' })

      expect(res.status).toBe(200)
      expect(res.body.title).toBe('Updated Course')
    })

    it('should delete a course', async () => {
      const coursesRes = await request(app).get('/courses')
      const courseId = coursesRes.body[0]?._id

      const res = await request(app).delete(`/courses/${courseId}`)

      expect(res.status).toBe(200)
    })
  })
}