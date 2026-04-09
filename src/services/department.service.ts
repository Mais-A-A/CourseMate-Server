import Department from '../models/department.model.js'
import type { Department as DepartmentType } from '../schemas/department.schema.js'

class DepartmentService {
  async createDepartment(deptData: DepartmentType) {
    const dept = new Department(deptData)
    return await dept.save()
  }

  async getAllDepartments() {
    return await Department.find().lean()
  }

  async getDepartmentById(deptId: string) {
    return await Department.findById(deptId).lean()
  }

  async updateDepartment(deptId: string, deptData: Partial<DepartmentType>) {
    return await Department.findByIdAndUpdate(deptId, deptData, { new: true })
  }

  async deleteDepartment(deptId: string) {
    return await Department.findByIdAndDelete(deptId)
  }
}

export const departmentService = new DepartmentService()
export default departmentService