import type { FastifyInstance } from 'fastify'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { config } from '../config/env.ts'
import cors from "./cors.ts";
import rateLimitPlugin from "./rateLimitPlugin.ts";
import { verifyRole } from './auth.ts'

export const setupPlugins = async (fastify: FastifyInstance) => {
  // CORS
  await fastify.register(cors)

  // Rate Limit
  await fastify.register(rateLimitPlugin)

  // Cookie
  await fastify.register(cookie, {
    secret: config.JWT_SECRET,
    parseOptions: {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'lax',
    }
  })

  // JWT
  await fastify.register(jwt, {
    secret: config.JWT_SECRET,
    cookie: {
      cookieName: 'auth-token',
      signed: false,
    }
  })

  // Swagger
  if (config.NODE_ENV === 'development') {
    await fastify.register(swagger, {
      swagger: {
        info: {
          title: 'Dream Journal API',
          description: 'API para aplicativo de diário de sonhos',
          version: '1.0.0',
        },
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        securityDefinitions: {
          Bearer: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header'
          }
        }
      },
    })

    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
      staticCSP: true, // Adicionando esta linha
    })
  }

  // Auth decorator
  fastify.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' })
    }
  })

  // Role verification decorator
  fastify.decorate('verifyRole', verifyRole)
  fastify.decorate('verifyAdmin', verifyRole('admin'))
}