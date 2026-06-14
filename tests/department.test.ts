import { departmentService } from '../src/features/department/department.service.js'
import type { Department } from '../src/features/department/department.schema.js'
import { describe, it, expect } from 'vitest'
import env from '../env.js'
import request from 'supertest'
import app from '../app.js'

if (env.USE_REAL !== 'true') {
  describe('DepartmentService', () => {
    it('should create a new department', async () => {
      const deptData: Department = {
        department_name: 'Computer Science',
        dean_name: 'Dr. Liana',
      }
      const dept = await departmentService.createDepartment(deptData)
      expect(dept).toHaveProperty('_id')
      expect(dept.department_name).toBe(deptData.department_name)
      expect(dept.dean_name).toBe(deptData.dean_name)
    })

    it('should retrieve all departments', async () => {
      const depts = await departmentService.getAllDepartments()
      expect(Array.isArray(depts)).toBe(true)
    })

    it('should retrieve a department by ID', async () => {
      const deptData: Department = {
        department_name: 'Computer Science',
        dean_name: 'Dr. Liana',
      }
      const createdDept: any = await departmentService.createDepartment(deptData)
      const retrievedDept: any = await departmentService.getDepartmentById(
        createdDept!._id.toString(),
      )
      expect(retrievedDept).toBeTruthy()
      expect(retrievedDept!._id.toString()).toBe(createdDept!._id.toString())
    })

    it('should update a department', async () => {
      const deptData: Department = {
        department_name: 'Computer Science',
        dean_name: 'Dr. Liana',
      }
      const createdDept: any = await departmentService.createDepartment(deptData)
      const updatedData: Partial<Department> = {
        dean_name: 'Dr. Wisam',
      }
      const updatedDept: any = await departmentService.updateDepartment(
        createdDept!._id.toString(),
        updatedData,
      )
      expect(updatedDept).toBeTruthy()
      expect(updatedDept!.dean_name).toBe(updatedData.dean_name)
    })

    it('should delete a department', async () => {
      const deptData: Department = {
        department_name: 'Computer Science',
        dean_name: 'Dr. Liana',
      }
      const createdDept: any = await departmentService.createDepartment(deptData)
      const deletedDept: any = await departmentService.deleteDepartment(
        createdDept!._id.toString(),
      )
      expect(deletedDept).toBeTruthy()
      expect(deletedDept!._id.toString()).toBe(createdDept!._id.toString())
    })
  })
} else {
  describe('Department Integration tests', () => {
    it('should create a new department', async () => {
      const res = await request(app).post('/departments').send({
        department_name: 'Computer Science',
        dean_name: 'Dr. Liana',
      })
      expect(res.status).toBe(201)
      expect(res.body.department_name).toBe('Computer Science')
    })

    it('should retrieve all departments', async () => {
      const res = await request(app).get('/departments')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('should update a department', async () => {
      const deptsRes = await request(app).get('/departments')
      const deptId = deptsRes.body[0]?._id
      const res = await request(app).put(`/departments/${deptId}`).send({
        dean_name: 'Dr. Wisam',
      })
      expect(res.status).toBe(200)
      expect(res.body.dean_name).toBe('Wisam')
    })

    it('should delete a department', async () => {
      const deptsRes = await request(app).get('/departments')
      const deptId = deptsRes.body[0]?._id
      const res = await request(app).delete(`/departments/${deptId}`)
      expect(res.status).toBe(200)
    })
  })
}