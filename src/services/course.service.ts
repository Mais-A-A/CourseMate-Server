import { Course } from '../models/course.model.js'
import type { Course as CourseType } from '../schemas/course.schema.js'

class CourseService {
  async createCourse(courseData: CourseType) {
    const course = new Course(courseData)
    return await course.save()
  }

  async getAllCourses() {
    return await Course.find().lean()
  }

  async getCourseById(courseId: string) {
    return await Course.findById(courseId).lean()
  }

  async updateCourse(courseId: string, courseData: Partial<CourseType>) {
    return await Course.findByIdAndUpdate(courseId, courseData, { new: true })
  }

  async deleteCourse(courseId: string) {
    return await Course.findByIdAndDelete(courseId)
  }
}

export const courseService = new CourseService()
export default courseService