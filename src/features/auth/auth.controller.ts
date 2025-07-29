import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authService } from './auth.service.ts'
import { createAdminSchema } from './auth.types.ts'

// Tipos inferidos dos schemas
const googleCallbackQuerySchema = z.object({
  code: z.string(),
  state: z.string().optional(),
})

const nextjsSigninSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  image: z.string().optional(),
  googleId: z.string(),
  verified: z.boolean(),
})

type GoogleCallbackQuery = z.infer<typeof googleCallbackQuerySchema>
type NextjsSigninBody = z.infer<typeof nextjsSigninSchema>
type CreateAdminBody = z.infer<typeof createAdminSchema>

export const authControllers = {
  // Redirect to Google OAuth
  async googleRedirect(request: FastifyRequest, reply: FastifyReply) {
    const authUrl = authService.getGoogleAuthUrl()
    return reply.redirect(authUrl)
  },

  // Handle Google OAuth callback
  async googleCallback(
    request: FastifyRequest<{ Querystring: GoogleCallbackQuery }>,
    reply: FastifyReply
  ) {
    try {
      // Não precisa validar - já foi validado pelo fastify-type-provider-zod
      const { code } = request.query
      const user = await authService.handleGoogleCallback(code)

      // Generate JWT token
      const token = request.server.jwt.sign({
        userId: user.id,
        email: user.email,
        plan: user.plan,
        role: user.role,
      }, {
        expiresIn: '7d'
      })

      // Set cookie
      reply.setCookie('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan,
          role: user.role,
          image: user.image,
        },
        token,
      }
    } catch (error) {
      request.log.error('Google auth error:', error)
      return reply.code(400).send({
        error: 'Authentication failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  },

  // Handle NextJS Auth signin
  async nextjsSignin(
    request: FastifyRequest<{ Body: NextjsSigninBody }>,
    reply: FastifyReply
  ) {
    try {
      // Não precisa validar - já foi validado pelo fastify-type-provider-zod
      const { email, name, image, verified } = request.body
      const user = await authService.handleNextjsSignin(email, name, image, verified)

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan,
          role: user.role,
          image: user.image,
        }
      }
    } catch (error) {
      request.log.error('NextJS signin error:', error)
      return reply.code(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  },

  // Logout user
  async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      reply.clearCookie('auth-token')
      await authService.logoutUser((request as any).user?.userId)
      return { message: 'Logged out successfully' }
    } catch (error) {
      request.log.error('Logout error:', error)
      return reply.code(500).send({
        error: 'Logout failed'
      })
    }
  },

  // Get current user
  async getMe(request: FastifyRequest, reply: FastifyReply) {
    try {
      const jwtUser = (request as any).user
      const user = await authService.getMe(jwtUser.userId)

      if (!user) {
        return reply.code(404).send({ error: 'User not found' })
      }
      return { user }
    } catch (error) {
      request.log.error('Get me error:', error)
      return reply.code(500).send({
        error: 'Failed to get user info'
      })
    }
  },

  // Create admin
  async createAdmin(
    request: FastifyRequest<{ Body: CreateAdminBody }>,
    reply: FastifyReply
  ) {
    try {
      // Não precisa validar - já foi validado pelo fastify-type-provider-zod
      const { adminSecret, email, password, name, phone } = request.body
      const user = await authService.createAdmin(adminSecret, email, password, name, phone)

      return reply.status(201).send({
        message: 'Admin created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          plan: user.plan,
          role: user.role,
          language: user.language,
          timezone: user.timezone,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }
      })
    } catch (error) {
      console.log('Create admin error:', error)
      request.log.error('Create admin error:', error)
      if (error instanceof Error) {
        if (error.message === 'Unauthorized') {
          return reply.status(403).send({ error: 'Unauthorized' })
        }
        if (error.message === 'User already exists') {
          return reply.code(409).send({ error: 'User already exists' })
        }
      }
      return reply.code(400).send({ error: 'Failed to create admin' })
    }
  },

  async getAdmin(request: FastifyRequest, reply: FastifyReply) {
    try {
      const usersAdmin = await authService.getAdminUsers()
      return { usersAdmin }
    } catch (error) {
      request.log.error('get admin error:', error)
      return reply.code(400).send({ error: 'Failed to get admin' })
    }
  }
}