import { z } from 'zod'
import { env } from 'custom-env'

env(true)

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  MONGO_USERNAME: z.string(),
  MONGO_PASSWORD: z.string(),
  MONGO_CLUSTER: z.string(),
  MONGO_DATABASE_NAME: z.string(),
  SERVER_PORT: z.string(),
  CLIENT_ID: z.string(),
  CLIENT_SECRET: z.string(),
  GOOGLE_CALLBACK_URL: z.string(),
  JWT_SECRET: z.string(),
  CLIENT_URL: z.string(),
  USE_REAL: z.string().optional(),
  GEMINI_API_KEY: z.string(),
  GEMINI_EMBEDDING_KEY: z.string(),
})

const parsedEnv = envSchema.parse(process.env)

export default parsedEnv
