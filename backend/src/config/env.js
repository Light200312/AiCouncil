import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();
//Environment variables are external configuration. If MONGO_URI or JWT_SECRET is missing, we want the application to fail immediately with a clear error instead of failing later during a request.
const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  MONGO_URI: z.string().min(1),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("1d"),

 CLIENT_URLS: z
  .string()
  .transform((value) => JSON.parse(value))
  .pipe(z.array(z.string().url())),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment variables:", result.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = result.data;