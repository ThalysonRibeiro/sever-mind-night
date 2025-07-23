import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.ts'
import { getGoogleAuthUrl, getGoogleUserInfo } from '../../lib/google-auth.ts'

const googleCallbackSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
})

export const authControllers = {
  // Redirect to Google OAuth
  async googleRedirect(request: FastifyRequest, reply: FastifyReply) {
    const authUrl = getGoogleAuthUrl()
    return reply.redirect(authUrl)
  },

  // Handle Google OAuth callback
  async googleCallback(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { code } = googleCallbackSchema.parse(request.query)

      // Get user info from Google
      const googleUser = await getGoogleUserInfo(code)

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { email: googleUser.email }
      })

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            name: googleUser.name,
            image: googleUser.picture,
            emailVerified: googleUser.verified ? new Date() : null,
            plan: 'TRIAL',
            role: 'USER',
          },
        })

        // Create user settings
        await prisma.userSettings.create({
          data: {
            userId: user.id,
          }
        })

        // Create user stats
        await prisma.userStats.create({
          data: {
            userId: user.id,
          }
        })

        // Log audit
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'user_created',
            entity: 'user',
            entityId: user.id,
            newValues: {
              email: user.email,
              name: user.name,
              provider: 'google'
            }
          }
        })
      } else {
        // Update last active
        await prisma.user.update({
          where: { id: user.id },
          data: { lastActive: new Date() }
        })

        // Log audit
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'user_login',
            entity: 'user',
            entityId: user.id,
          }
        })
      }

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

  // Logout user
  async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Clear cookie
      reply.clearCookie('auth-token')

      // If user is authenticated, log audit
      if (request.user) {
        const user = request.user as any
        await prisma.auditLog.create({
          data: {
            userId: user.userId,
            action: 'user_logout',
            entity: 'user',
            entityId: user.userId,
          }
        })
      }

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
      const jwtUser = request.user as any

      const user = await prisma.user.findUnique({
        where: { id: jwtUser.userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          plan: true,
          role: true,
          timezone: true,
          language: true,
          lastActive: true,
          createdAt: true,
        }
      })

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

  // Handle NextJS Auth signin
  async nextjsSignin(request: FastifyRequest, reply: FastifyReply) {
    const nextjsSigninSchema = z.object({
      email: z.string().email(),
      name: z.string().optional(),
      image: z.string().optional(),
      googleId: z.string(),
      verified: z.boolean(),
    })

    try {
      const { email, name, image, googleId, verified } = nextjsSigninSchema.parse(request.body)

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            email,
            name,
            image,
            emailVerified: verified ? new Date() : null,
            plan: 'TRIAL',
            role: 'USER',
            lastActive: new Date(),
          },
        })

        // Create user settings
        await prisma.userSettings.create({
          data: { userId: user.id }
        })

        // Create user stats
        await prisma.userStats.create({
          data: { userId: user.id }
        })

        // Log user creation
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'user_created',
            entity: 'user',
            entityId: user.id,
            newValues: { email, name, provider: 'nextjs-google' }
          }
        })
      } else {
        // Update existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            lastActive: new Date(),
            image, // Update profile image
          }
        })

        // Log login
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'user_login',
            entity: 'user',
            entityId: user.id,
          }
        })
      }

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
      return reply.code(400).send({ error: 'Signin failed' })
    }
  },
}