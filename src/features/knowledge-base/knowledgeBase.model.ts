import { model, Schema } from 'mongoose'

const knowledgeBaseSchema = new Schema(
  {
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
    source: { type: String, required: true },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
)

export const KnowledgeBase = model('KnowledgeBase', knowledgeBaseSchema)
export default KnowledgeBase
