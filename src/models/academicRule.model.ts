import { Schema, model } from 'mongoose'

const academicRuleSchema = new Schema({
  rule_type: { type: String, required: true },
  description: { type: String, required: true },
})

const AcademicRule = model('AcademicRule', academicRuleSchema)
export default AcademicRule
