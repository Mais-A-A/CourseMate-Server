import { Schema, model } from 'mongoose'

const academicRuleSchema = new Schema({
  // I assumed that there is no need to represent the relationship between the academic rules and the admin because the rules are created and managed by the admin but they are not directly associated with a specific admin user.
  rule_type: { type: String, required: true },
  description: { type: String, required: true },
})

export const AcademicRule = model('AcademicRule', academicRuleSchema)
export default AcademicRule
