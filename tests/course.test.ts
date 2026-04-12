import { courseService } from '../src/services/course.service.js'
import type { Course } from '../src/schemas/course.schema.js'
import { describe, it, expect } from 'vitest'
import env from '../env.js'
import request from 'supertest'
import app from '../app.js'

if (env.USE_REAL !== 'true') {
  describe('CourseService', () => {
    it('should create a new course', async () => {
      const courseData: Course = {
        courseNo: 101,
        coursesArabicName: 'Intro to CS',
        coursesCreditHours: 3,
        preCourse: [],
        department_id: '64a5c1b1f1a2b3c4d5e6f789',
        courseLevel: 1,
        courseOrder: 1,
      }

      const course = await courseService.createCourse(courseData)

      expect(course).toHaveProperty('_id')
      expect(course.coursesArabicName).toBe(courseData.coursesArabicName)
      expect(course.courseNo).toBe(courseData.courseNo)
    })

    it('should retrieve all courses', async () => {
      const courses = await courseService.getAllCourses()
      expect(Array.isArray(courses)).toBe(true)
    })

    it('should retrieve a course by ID', async () => {
      const courseData: Course = {
        courseNo: 102,
        coursesArabicName: 'Data Structures',
        coursesCreditHours: 3,
        preCourse: [],
        department_id: '64a5c1b1f1a2b3c4d5e6f789',
        courseLevel: 2,
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
        courseNo: 103,
        coursesArabicName: 'Algorithms',
        coursesCreditHours: 3,
        preCourse: [],
        department_id: '64a5c1b1f1a2b3c4d5e6f789',
        courseLevel: 2,
      }

      const created: any = await courseService.createCourse(courseData)

      const updated: any = await courseService.updateCourse(
        created._id.toString(),
        { coursesArabicName: 'Advanced Algorithms' },
      )

      expect(updated).toBeTruthy()
      expect(updated!.coursesArabicName).toBe('Advanced Algorithms')
    })

    it('should delete a course', async () => {
      const courseData: Course = {
        courseNo: 104,
        coursesArabicName: 'Databases',
        coursesCreditHours: 3,
        preCourse: [],
        department_id: '64a5c1b1f1a2b3c4d5e6f789',
        courseLevel: 2,
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
        courseNo: 101,
        coursesArabicName: 'Intro to CS',
        coursesCreditHours: 3,
        preCourse: [],
        department_id: '64a5c1b1f1a2b3c4d5e6f789',
        courseLevel: 1,
      })

      expect(res.status).toBe(201)
      expect(res.body.coursesArabicName).toBe('Intro to CS')
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
        .send({ coursesArabicName: 'Updated Course' })

      expect(res.status).toBe(200)
      expect(res.body.coursesArabicName).toBe('Updated Course')
    })

    it('should delete a course', async () => {
      const coursesRes = await request(app).get('/courses')
      const courseId = coursesRes.body[0]?._id

      const res = await request(app).delete(`/courses/${courseId}`)

      expect(res.status).toBe(200)
    })
  })
}
