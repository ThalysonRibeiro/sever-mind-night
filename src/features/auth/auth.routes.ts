import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authControllers } from './auth.controller.ts'
import { createAdminSchema, createAdminResponseSchema, publicUserSchema } from './auth.types.ts'

export const authRoutes = async (fastify: FastifyInstance) => {
  // Google auth routes
  fastify.get('/google', {
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

  fastify.get('/google/callback', {
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

  // NextJS auth integration
  fastify.post('/nextjs/signin', {
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

  // Admin routes
  fastify.post('/admin', {
    schema: {
      tags: ['Admin'],
      summary: 'Create a new admin user',
      body: createAdminSchema,
      response: {
        201: createAdminResponseSchema,
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

  fastify.get('/admin', {
    preHandler: [fastify.authenticate, fastify.verifyAdmin],
    // schema: {
    //   tags: ['Admin'],
    //   summary: 'Get all admin users',
    //   response: {
    //     200: z.array(publicUserSchema),
    //     400: {
    //       type: 'object',
    //       properties: {
    //         error: { type: 'string' },
    //         details: { type: 'object' },
    //       },
    //     },
    //     403: {
    //       type: 'object',
    //       properties: {
    //         error: { type: 'string' },
    //       },
    //     },
    //   }
    // },
  }, authControllers.getAdmin);

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