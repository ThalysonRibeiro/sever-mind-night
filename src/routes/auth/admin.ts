import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authControllers } from '../../controllers/auth/index.ts';
import { isValidEmail } from '../../utils/emailValidation.ts';

const phoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/;

const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .max(100, 'A senha deve ter no máximo 100 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
  .regex(
    /[^a-zA-Z0-9]/,
    'A senha deve conter pelo menos um caractere especial'
  );

export const createAdminSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.email().refine(isValidEmail, {
    message: 'Email is not valid or is from a restricted domain',
  }),
  phone: z.string().min(8).refine((val) => phoneRegex.test(val), {
    message: 'Invalid phone number format',
  }),
  password: passwordSchema,
  adminSecret: z.string().min(10, { message: 'Invalid admin secret' }),
});

export const publicUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  plan: z.string(),
  role: z.string(),
  language: z.string(),
  timezone: z.string(),
  status: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createAdminResponseSchema = z.object({
  message: z.string(),
  user: publicUserSchema,
});

export const adminRoutes = async (fastify: FastifyInstance) => {
  fastify.post('/', {
    schema: {
      tags: ['Admin'],
      summary: 'Create a new admin user',
      body: createAdminSchema,
      response: {
        200: createAdminResponseSchema,
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'object' },
          },
        },
        403: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      }
    },
  }, authControllers.createAdmin)
}
