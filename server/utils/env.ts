import { z } from "zod";

export const envVariables = z.object({
  NODE_ENV: z.string(),
  PORT: z.string(),
  ORIGINS: z.array(z.string()),
  DB_URL: z.string(),
  CLOUD_NAME: z.string(),
  CLOUD_API_KEY: z.string(),
  CLOUD_SECRET_key: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string(),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string(),
  SMTP_SERVICE: z.string(),
  SMTP_MAIL: z.string(),
  SMTP_PASSWORD: z.string(),
  SMTP_FROM_NAME: z.string(),
  SMTP_FROM_EMAIL: z.string(),
  ACCESS_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  ACCESS_TOKEN_EXPIRE: z.string(),
  REFRESH_TOKEN_EXPIRE: z.string(),
});

envVariables.parse(process.env);
