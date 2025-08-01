import { config as dotenvConfig } from 'dotenv'
import { z } from 'zod'

dotenvConfig()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),

  // Flexível para testes
  GOOGLE_CLIENT_ID: z.string().default('test-google-client-id'),
  GOOGLE_CLIENT_SECRET: z.string().default('test-google-client-secret'),
  GOOGLE_REDIRECT_URI: z.string().default('http://localhost:3333/auth/google/callback'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Admin e secrets
  ADMIN_SECRET: z.string().default('test-admin-secret'),

  // Cloudinary (opcional)
  CLOUDINARY_CLOUD_NAME: z.string().default('test-cloud'),
  CLOUDINARY_API_KEY: z.string().default('test-api-key'),
  CLOUDINARY_API_SECRET: z.string().default('test-api-secret'),

  // Redis (opcional)
  UPSTASH_REDIS_REST_URL: z.string().default(''),
  UPSTASH_REDIS_REST_TOKEN: z.string().default(''),
})

export const config = envSchema.parse(process.env)