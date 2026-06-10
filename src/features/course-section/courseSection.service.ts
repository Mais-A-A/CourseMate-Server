import { CourseSection } from './courseSection.model.js'
import type { CourseSection as CourseSectionType } from './courseSection.schema.js'

class CourseSectionService {
  async createCourseSection(sectionData: CourseSectionType) {
    const section = new CourseSection(sectionData)
    return await section.save()
  }

  async getAllCourseSections() {
    return await CourseSection.find().lean()
  }

  async getCourseSectionById(sectionId: string) {
    return await CourseSection.findById(sectionId).lean()
  }

  async updateCourseSection(sectionId: string, sectionData: Partial<CourseSectionType>) {
    return await CourseSection.findByIdAndUpdate(sectionId, sectionData, { new: true })
  }

  async deleteCourseSection(sectionId: string) {
    return await CourseSection.findByIdAndDelete(sectionId)
  }
}

export const courseSectionService = new CourseSectionService()
export default courseSectionService