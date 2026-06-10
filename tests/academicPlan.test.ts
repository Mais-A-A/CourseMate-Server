import { academicPlanService } from '../src/features/academic-plan/academicPlan.service.js'
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import env from '../env.js'
import type { AcademicPlan } from '../src/features/academic-plan/academicPlan.schema.js'

if (env.USE_REAL !== 'true') {
  describe('AcademicPlanService', () => {
    it('should create a new academic plan', async () => {
      const planData: AcademicPlan = {
        majorNo: 22,
        planYear: 2022,
        groups: [
          {
            groupNo: 1,
            groupEnglishName: 'Core',
            groupCoursList: [
              {
                courseNo: 101,
                preCourse: [],
                courseGrades: [{ gradeCGrade: 'A', gradeResultGrade: 'P', gradeNGrade: 0, courseTaken: 1 }],
              },
            ],
          },
        ],
        levels: [],
      }
      const plan = await academicPlanService.createAcademicPlan(planData)
      expect(plan).toHaveProperty('_id')
      expect(plan.majorNo).toBe(planData.majorNo)
      expect(plan.planYear).toBe(planData.planYear)
      expect(plan.groups).toHaveLength(1)
    })

    it('should retrieve all academic plans', async () => {
      const plans = await academicPlanService.getAllAcademicPlans()
      expect(Array.isArray(plans)).toBe(true)
    })

    it('should retrieve an academic plan by ID', async () => {
      const planData: AcademicPlan = {
        majorNo: 24,
        planYear: 2024,
        groups: [
          {
            groupNo: 2,
            groupEnglishName: 'Electives',
            groupCoursList: [
              {
                courseNo: 201,
                preCourse: [],
                courseGrades: [{ gradeCGrade: 'B', gradeResultGrade: 'P', gradeNGrade: 0, courseTaken: 1 }],
              },
            ],
          },
        ],
        levels: [],
      }
      const createdPlan = await academicPlanService.createAcademicPlan(planData)
      const retrievedPlan = await academicPlanService.getAcademicPlanById(
        createdPlan.id.toString(),
      )
      expect(retrievedPlan).toBeTruthy()
      expect(retrievedPlan?._id.toString()).toBe(createdPlan.id.toString())
    })

    it('should update an academic plan', async () => {
      const planData: AcademicPlan = {
        majorNo: 25,
        planYear: 2025,
        groups: [
          {
            groupNo: 3,
            groupEnglishName: 'Physics Core',
            groupCoursList: [
              {
                courseNo: 301,
                preCourse: [],
                courseGrades: [
                  { gradeCGrade: 'A', gradeResultGrade: 'P', gradeNGrade: 0, courseTaken: 1 },
                  { gradeCGrade: 'B', gradeResultGrade: 'P', gradeNGrade: 0, courseTaken: 1 },
                ],
              },
            ],
          },
        ],
        levels: [],
      }
      const createdPlan = await academicPlanService.createAcademicPlan(planData)
      const updatedData: Partial<AcademicPlan> = {
        planYear: 2026,
      }
      const updatedPlan = await academicPlanService.updateAcademicPlan(
        createdPlan.id.toString(),
        updatedData,
      )
      expect(updatedPlan).toBeTruthy()
      expect(updatedPlan?.planYear).toBe(updatedData.planYear)
    })

    it('should delete an academic plan', async () => {
      const planData: AcademicPlan = {
        majorNo: 21,
        planYear: 2021,
        groups: [],
        levels: [],
      }
      const createdPlan = await academicPlanService.createAcademicPlan(planData)
      const deletedPlan = await academicPlanService.deleteAcademicPlan(
        createdPlan.id.toString(),
      )
      expect(deletedPlan).toBeTruthy()
      expect(deletedPlan?.id.toString()).toBe(createdPlan.id.toString())
    })
  })
} else {
  describe('AcademicPlan Integration tests', () => {
    it('should create a new academic plan', async () => {
      const planData = {
        majorNo: 22,
        planYear: 2022,
        groups: [],
      }
      const res = await request(app).post('/academic-plan').send(planData)
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('_id')
      expect(res.body.majorNo).toBe(planData.majorNo)
      expect(res.body.planYear).toBe(planData.planYear)
    })

    it('should get all academic plans', async () => {
      const res = await request(app).get('/academic-plan')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('should get an academic plan by ID', async () => {
      const planData = {
        majorNo: 24,
        planYear: 2024,
        groups: [],
      }
      const createRes = await request(app).post('/academic-plan').send(planData)
      const planId = createRes.body._id
      const res = await request(app).get(`/academic-plan/${planId}`)
      expect(res.status).toBe(200)
      expect(res.body._id).toBe(planId)
    })

    it('should update an academic plan', async () => {
      const planData = {
        majorNo: 25,
        planYear: 2025,
        groups: [],
      }
      const createRes = await request(app).post('/academic-plan').send(planData)
      const planId = createRes.body._id
      const updatedData = {
        planYear: 2026,
      }
      const res = await request(app)
        .put(`/academic-plan/${planId}`)
        .send(updatedData)
      expect(res.status).toBe(200)
      expect(res.body.planYear).toBe(updatedData.planYear)
    })

    it('should delete an academic plan', async () => {
      const planData = {
        majorNo: 21,
        planYear: 2021,
        groups: [],
      }
      const createRes = await request(app).post('/academic-plan').send(planData)
      const planId = createRes.body._id
      const res = await request(app).delete(`/academic-plan/${planId}`)
      expect(res.status).toBe(200)
    })
  })
}
