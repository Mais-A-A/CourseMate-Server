import { z } from "zod";
import { env } from "custom-env";

env(true);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  MONGO_USERNAME: z.string(),
  MONGO_PASSWORD: z.string(),
  MONGO_CLUSTER: z.string(),
  MONGO_DATABASE_NAME: z.string(),
  SERVER_PORT: z.string()
});

const parsedEnv = envSchema.parse(process.env);

export default parsedEnv;