import { Schema, model } from 'mongoose'

const departmentSchema = new Schema(
  {
    department_name: { type: String, required: true },
    dean_name: {type: String, required: true },
  },
  {
    timestamps: {
      createdAt: 'issued_at',
      updatedAt: 'updated_at',
    },
  },
)

const Department = model('Department', departmentSchema)

export default Department