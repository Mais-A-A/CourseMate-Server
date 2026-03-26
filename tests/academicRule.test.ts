import { academicRuleService } from '../src/services/academicRule.service.js'
import { describe, it, expect } from 'vitest'
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
