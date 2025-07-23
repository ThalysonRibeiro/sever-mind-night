import type { FastifyInstance } from 'fastify'
import { authControllers } from '../../controllers/auth/index.ts'

export const nextjsAuthRoutes = async (fastify: FastifyInstance) => {
  // Receber dados de login do NextJS
  fastify.post('/signin', {
    schema: {
      tags: ['Auth'],
      summary: 'Handle NextJS Auth signin',
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          image: { type: 'string' },
          googleId: { type: 'string' },
          verified: { type: 'boolean' }
        },
        required: ['email', 'googleId']
      }
    }
  }, authControllers.nextjsSignin)
}
