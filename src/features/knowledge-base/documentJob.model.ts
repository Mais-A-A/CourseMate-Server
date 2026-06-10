import { model, Schema } from 'mongoose'

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

const documentJobSchema = new Schema(
  {
    filename: { type: String, required: true },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    chunks: { type: Number, default: null },
    error: { type: String, default: null },
    fileBuffer: { type: Buffer, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

export const DocumentJob = model('DocumentJob', documentJobSchema)
export default DocumentJob
