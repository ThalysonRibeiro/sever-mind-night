import type { FastifyInstance } from 'fastify'
import { googleAuthRoutes } from './google.ts'
import { nextjsAuthRoutes } from './nextjs.ts'
import { authControllers } from '../../controllers/auth/index.ts'

export const authRoutes = async (fastify: FastifyInstance) => {
  // Google auth routes (original)
  await fastify.register(googleAuthRoutes, { prefix: '/google' })

  // NextJS auth integration
  await fastify.register(nextjsAuthRoutes, { prefix: '/nextjs' }) // Adicionar esta linha

  // Logout route
  fastify.post('/logout', {
    schema: {
      tags: ['Auth'],
      summary: 'Logout user',
      response: {
        200: {
          type: 'object',
          properties: { message: { type: 'string' } }
        }
      }
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