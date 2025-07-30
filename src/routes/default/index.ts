import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { verifyRole } from '../../plugins/auth.ts'

export const defaultRoutes = async (fastify: FastifyInstance) => {
  // Rota com schema Zod
  fastify.get('/', {
    schema: {
      tags: ['Status'],
      summary: 'Check server status',
      response: {
        200: z.object({ status: z.string() }),
      },
    },
  }, async (request, reply) => {
    return { status: 'ok' }
  })

  // Rotas sem schema (temporariamente)
  fastify.get('/health', {
    schema: {
      tags: ['Status'],
      summary: 'Check server health',
      response: {
        200: z.object({ status: z.string(), timestamp: z.string() }),
      },
    },
  }, async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  fastify.get(
    '/editor-stuff',
    {
      preHandler: [fastify.authenticate, verifyRole('USER')],
      schema: {
        tags: ['Test'],
        summary: 'Test endpoint for USER role',
        security: [{ Bearer: [] }],
        response: {
          200: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      return { message: 'You are an editor!' }
    }
  )
}
