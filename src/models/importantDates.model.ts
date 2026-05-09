import { Schema, model } from 'mongoose'

const importantDateSchema = new Schema(
  {
    date_name: { type: String, required: true },
    date: { type: Date, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ['holiday', 'registration', 'deadline', 'event'],
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: 'issued_at',
      updatedAt: 'updated_at',
    },
  },
)

export const ImportantDate = model('ImportantDate', importantDateSchema)
export default ImportantDate
