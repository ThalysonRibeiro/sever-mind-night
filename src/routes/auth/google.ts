import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authControllers } from '../../controllers/auth/index.ts'

const googleCallbackSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
})

export const googleAuthRoutes = async (fastify: FastifyInstance) => {
  // Redirect to Google
  fastify.get('/', {
    schema: {
      tags: ['Auth'],
      summary: 'Redirect to Google OAuth',
      response: {
        302: {
          type: 'object',
          properties: {
            url: { type: 'string' }
          }
        }
      }
    }
  }, authControllers.googleRedirect)

  // Google callback
  fastify.get('/callback', {
    schema: {
      tags: ['Auth'],
      summary: 'Google OAuth callback',
      querystring: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          state: { type: 'string' }
        },
        required: ['code']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                plan: { type: 'string' },
                role: { type: 'string' },
                image: { type: 'string' },
              },
              required: ['id', 'name', 'email', 'plan']
            },
            token: { type: 'string' }
          }
        }
      }
    }
  }, authControllers.googleCallback)
}
