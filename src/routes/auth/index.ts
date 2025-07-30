// routes/auth/index.ts
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authControllers } from '../../features/auth/auth.controller.ts'
import { createAdminSchema, createAdminResponseSchema } from '../../features/auth/auth.types.ts'

// Schemas Zod para todas as rotas
const googleCallbackQuerySchema = z.object({
  code: z.string(),
  state: z.string().optional()
})

const nextjsSigninSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  image: z.string().optional(),
  googleId: z.string(),
  verified: z.boolean()
})

export const authRoutes = async (fastify: FastifyInstance) => {
  // Google auth routes
  fastify.get('/google', {
    schema: {
      tags: ['Auth'],
      summary: 'Redirect to Google OAuth',
    }
  }, authControllers.googleRedirect)

  fastify.get('/google/callback', {
    schema: {
      tags: ['Auth'],
      summary: 'Google OAuth callback',
      querystring: googleCallbackQuerySchema, // Use Zod schema
    }
  }, authControllers.googleCallback)

  // NextJS auth integration
  fastify.post('/nextjs/signin', {
    schema: {
      tags: ['Auth'],
      summary: 'Handle NextJS Auth signin',
      body: nextjsSigninSchema, // Use Zod schema
    }
  }, authControllers.nextjsSignin)

  // Admin routes
  fastify.post('/admin', {
    schema: {
      tags: ['Admin'],
      summary: 'Create a new admin user',
      body: createAdminSchema, // Já é um schema Zod
      response: {
        201: createAdminResponseSchema,
      }
    },
  }, authControllers.createAdmin)

  fastify.get('/admin', {
    schema: {
      tags: ['Admin'],
      summary: 'Get all admin users',
      response: {
        200: z.object({
          usersAdmin: z.array(z.object({ id: z.string(), email: z.string() })),
        }),
      },
    },
    preHandler: [fastify.authenticate, fastify.verifyAdmin],
  }, authControllers.getAdmin)

  // Logout route
  fastify.post('/logout', {
    schema: {
      tags: ['Auth'],
      summary: 'Logout user',
    }
  }, authControllers.logout)

  // Me route
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Auth'],
      summary: 'Get current user',
      security: [{ Bearer: [] }],
    }
  }, authControllers.getMe)
}