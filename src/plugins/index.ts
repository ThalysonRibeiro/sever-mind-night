import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import swagger from '@fastify/swagger'
// import scalarFastifyApiReference from '@scalar/fastify-api-reference'

import { config } from '../config/env.ts'
import cors from "./cors.ts";
import rateLimitPlugin from "./rateLimitPlugin.ts";
import { verifyRole } from './auth.ts'

export const setupPlugins = async (fastify: FastifyInstance) => {
  // 💡 Habilita uso nativo de Zod nos schemas
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  // CORS - primeiro
  await fastify.register(cors)

  // JWT e Cookie - ANTES do rate limit (necessário para autenticação)
  await fastify.register(cookie, {
    secret: config.JWT_SECRET,
    parseOptions: {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'lax',
    }
  })

  await fastify.register(jwt, {
    secret: config.JWT_SECRET,
    cookie: {
      cookieName: 'auth-token',
      signed: false,
    }
  })

  // Decorar métodos de autenticação ANTES do rate limit
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid token'
      reply.code(401).send({
        error: 'Unauthorized',
        message: errorMessage
      })
    }
  })

  fastify.decorate('verifyRole', verifyRole)
  fastify.decorate('verifyAdmin', verifyRole('ADMIN'))

  // Rate Limit - DEPOIS da autenticação estar configurada
  await fastify.register(rateLimitPlugin, {
    maxRequests: 150,
    enableLogs: true,
    skipRoutes: ['/docs', '/health', '/metrics', '/favicon.ico']
  })

  // Swagger - por último (desenvolvimento)
  if (config.NODE_ENV === 'development') {
    await fastify.register(swagger, {
      openapi: {
        info: {
          title: 'Mind Night API',
          description: 'API for Mind Night application',
          version: '1.0.0',
        },
        components: {
          securitySchemes: {
            Bearer: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
            Cookie: {
              type: 'apiKey',
              in: 'cookie',
              name: 'auth-token'
            }
          },
        },
      }
    })

    // Import dinâmico para evitar problemas nos testes
    try {
      const { default: scalarFastifyApiReference } = await import('@scalar/fastify-api-reference')
      await fastify.register(scalarFastifyApiReference, {
        routePrefix: '/docs',
        configuration: {
          theme: 'bluePlanet'
        }
      })
    } catch (error) {
      console.warn('Failed to load @scalar/fastify-api-reference:', error)
    }
  }
}