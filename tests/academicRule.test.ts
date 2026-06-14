import { academicRuleService } from '../src/features/academic-rule/academicRule.service.js'
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import env from '../env.js'

if (env.USE_REAL === 'false') {
  describe('AcademicRuleService', () => {
    it('should create a new academic rule', async () => {
      const ruleData = {
        rule_type: 'GPA Requirement',
        description: `Students
        must maintain a minimum GPA of 70 to remain in good academic status.`,
      }
      const rule = await academicRuleService.createAcademicRule(ruleData)
      expect(rule).toHaveProperty('_id')
      expect(rule.rule_type).toBe(ruleData.rule_type)
      expect(rule.description).toBe(ruleData.description)
    })

    it('should retrieve all academic rules', async () => {
      const rules = await academicRuleService.getAllAcademicRules()
      expect(Array.isArray(rules)).toBe(true)
    })
    it('should retrieve an academic rule by ID', async () => {
      const ruleData = {
        rule_type: 'GPA Requirement',
        description: `Students
        must maintain a minimum GPA of 70 to remain in good academic status.`,
      }
      const createdRule: any =
        await academicRuleService.createAcademicRule(ruleData)
      const retrievedRule: any = await academicRuleService.getAcademicRuleById(
        createdRule!._id.toString(),
      )
      expect(retrievedRule).toBeTruthy()
      expect(retrievedRule!._id.toString()).toBe(createdRule!._id.toString())
    })
    it('should update an academic rule', async () => {
      const ruleData = {
        rule_type: 'GPA Requirement',
        description: `Students
          must maintain a minimum GPA of 70 to remain in good academic status.`,
      }
      const createdRule: any =
        await academicRuleService.createAcademicRule(ruleData)
      const updatedData = {
        description: `Students
        must maintain a minimum GPA of 70 to remain in good academic status.`,
      }
      const updatedRule: any = await academicRuleService.updateAcademicRule(
        createdRule!._id.toString(),
        updatedData,
      )
      expect(updatedRule).toBeTruthy()
      expect(updatedRule!.description).toBe(updatedData.description)
    })
  })
} else {
  describe('AcademicRule Integration Tests', () => {
    it('should create a new academic rule', async () => {
      const ruleData = {
        rule_type: 'GPA Requirement',
        description: `Students
        must maintain a minimum GPA of 70 to remain in good academic status.`,
      }
      const res = await request(app).post('/academic-rule').send(ruleData)
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('_id')
      expect(res.body.rule_type).toBe(ruleData.rule_type)
      expect(res.body.description).toBe(ruleData.description)
    })
    it('should get all academic rules', async () => {
      const res = await request(app).get('/academic-rule')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })
    it('should get an academic rule by ID', async () => {
      const ruleData = {
        rule_type: 'GPA Requirement',
        description: `Students
      must maintain a minimum GPA of 70 to remain in good academic status.`,
      }
      const createRes = await request(app).post('/academic-rule').send(ruleData)
      const ruleId = createRes.body._id
      const res = await request(app).get(`/academic-rule/${ruleId}`)
      expect(res.status).toBe(200)
      expect(res.body._id).toBe(ruleId)
    })
    it('should update an academic rule', async () => {
      const ruleData = {
        rule_type: 'GPA Requirement',
        description: `Students
        must maintain a minimum GPA of 70 to remain in good academic status.`,
      }
      const createRes = await request(app).post('/academic-rule').send(ruleData)
      const ruleId = createRes.body._id
      const updatedData = {
        description: `Students
        must maintain a minimum GPA of 70 to remain in good academic status.`,
      }
      const res = await request(app)
        .put(`/academic-rule/${ruleId}`)
        .send(updatedData)
      expect(res.status).toBe(200)
      expect(res.body.description).toBe(updatedData.description)
    })
  })
}
