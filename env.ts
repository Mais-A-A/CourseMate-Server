import { z } from 'zod'
import { env } from 'custom-env'

if (process.env.NODE_ENV === 'test') {
  env('test')
} else {
  env(true)
}
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  MONGO_USERNAME: z.string(),
  MONGO_PASSWORD: z.string(),
  MONGO_CLUSTER: z.string(),
  MONGO_DATABASE_NAME: z.string(),
  SERVER_PORT: z.string(),
  USE_REAL: z.string().default('false'),
})

const parsedEnv = envSchema.parse(process.env)

export default parsedEnv
