import { academicPlanService } from '../src/services/academicPlan.service.js'
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import env from '../env.js'

if (env.USE_REAL !== 'true') {
  describe('AcademicPlanService', () => {
    it('should create a new academic plan', async () => {
      const planData = {
        plan_name: 'CS22',
        total_credits_required: 120,
        required_courses: ['CS101', 'CS102', 'CS103'],
      }
      const plan = await academicPlanService.createAcademicPlan(planData)
      expect(plan).toHaveProperty('_id')
      expect(plan.plan_name).toBe(planData.plan_name)
      expect(plan.total_credits_required).toBe(planData.total_credits_required)
      expect(plan.required_courses).toEqual(planData.required_courses)
    })

    it('should retrieve all academic plans', async () => {
      const plans = await academicPlanService.getAllAcademicPlans() 
      expect(Array.isArray(plans)).toBe(true)
    })

    it('should retrieve an academic plan by ID', async () => {
      const planData = {
        plan_name: 'CE24',
        total_credits_required: 100,
        required_courses: ['CE101', 'CE103'],
      }
      const createdPlan = await academicPlanService.createAcademicPlan(planData)
      const retrievedPlan = await academicPlanService.getAcademicPlanById(
        createdPlan.id.toString()
      )
      expect(retrievedPlan).toBeTruthy()
      expect(retrievedPlan?._id.toString()).toBe(createdPlan.id.toString())
    })

    it('should update an academic plan', async () => {
      const planData = {
        plan_name: 'PHY25',
        total_credits_required: 110,
        required_courses: ['PHY101', 'PHY102'],
      }
      const createdPlan = await academicPlanService.createAcademicPlan(planData)
      const updatedData = {
        total_credits_required: 115,
        required_courses: ['PHY101', 'PHY102', 'PHY103'],
      }
      const updatedPlan = await academicPlanService.updateAcademicPlan(
        createdPlan.id.toString(),
        updatedData
      )
      expect(updatedPlan).toBeTruthy()
      expect(updatedPlan?.total_credits_required).toBe(updatedData.total_credits_required)
      expect(updatedPlan?.required_courses).toEqual(updatedData.required_courses)
    })

    it('should delete an academic plan', async () => {
      const planData = {
        plan_name: 'CHEM21',
        total_credits_required: 90,
        required_courses: ['CHEM101', 'CHEM102'],
      }
      const createdPlan = await academicPlanService.createAcademicPlan(planData)
      const deletedPlan = await academicPlanService.deleteAcademicPlan(
        createdPlan.id.toString()
      )
      expect(deletedPlan).toBeTruthy()
      expect(deletedPlan?.id.toString()).toBe(createdPlan.id.toString())
    })
  })
} else {
  describe('AcademicPlan Integration tests', () => {
    it('should create a new academic plan', async () => {
      const planData = {
        plan_name: 'CS22',
        total_credits_required: 120,
        required_courses: ['CS101', 'CS102', 'CS103'],
      }
      const res = await request(app).post('/academic-plans').send(planData)
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('_id')
      expect(res.body.plan_name).toBe(planData.plan_name)
      expect(res.body.total_credits_required).toBe(planData.total_credits_required)
      expect(res.body.required_courses).toEqual(planData.required_courses)
    })

    it('should get all academic plans', async () => {
      const res = await request(app).get('/academic-plans')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('should get an academic plan by ID', async () => {
      const planData = {
        plan_name: 'CE24',
        total_credits_required: 100,
        required_courses: ['CE101', 'CE103'],
      }
      const createRes = await request(app).post('/academic-plans').send(planData)
      const planId = createRes.body._id
      const res = await request(app).get(`/academic-plans/${planId}`)
      expect(res.status).toBe(200)
      expect(res.body._id).toBe(planId)
    })

    it('should update an academic plan', async () => {
      const planData = {
        plan_name: 'PHY25',
        total_credits_required: 110,
        required_courses: ['PHY101', 'PHY102'],
      }
      const createRes = await request(app).post('/academic-plans').send(planData)
      const planId = createRes.body._id
      const updatedData = {
        total_credits_required: 115,
        required_courses: ['PHY101', 'PHY102', 'PHY103'],
      }
      const res = await request(app).put(`/academic-plans/${planId}`).send(updatedData)
      expect(res.status).toBe(200)
      expect(res.body.total_credits_required).toBe(updatedData.total_credits_required)
      expect(res.body.required_courses).toEqual(updatedData.required_courses)
    })

    it('should delete an academic plan', async () => {
      const planData = {
        plan_name: 'CHEM21',
        total_credits_required: 90,
        required_courses: ['CHEM101', 'CHEM102'],
      }
      const createRes = await request(app).post('/academic-plans').send(planData)
      const planId = createRes.body._id
      const res = await request(app).delete(`/academic-plans/${planId}`)
      expect(res.status).toBe(200)
    })
  })
}``