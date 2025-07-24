import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.ts'
import { getGoogleAuthUrl, getGoogleUserInfo } from '../../lib/google-auth.ts'
import { addWeeks } from 'date-fns'
import { PLANS_INTERPRETATION_QUOTA } from '../../utils/constants.ts'

const googleCallbackSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
})

// FUNÇÃO HELPER PARA EVITAR DUPLICAÇÃO DE CÓDIGO
async function createUserWithRelatedRecords(userData: {
  email: string;
  name?: string | null;
  image?: string | null;
  emailVerified?: Date | null;
  provider: string;
}) {
  return await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        image: userData.image,
        emailVerified: userData.emailVerified,
        plan: 'TRIAL',
        role: 'USER',
        lastActive: new Date(),
      },
    });

    // Create related records
    await Promise.all([
      // User settings
      tx.userSettings.create({
        data: { userId: user.id }
      }),

      // User stats
      tx.userStats.create({
        data: { userId: user.id }
      }),

      // Interpretation quota
      tx.interpretationQuota.create({
        data: {
          userId: user.id,
          dailyCredits: PLANS_INTERPRETATION_QUOTA.TRIAL.dailyCredits,
          weeklyCredits: PLANS_INTERPRETATION_QUOTA.TRIAL.weeklyCredits,
          nextResetDate: addWeeks(new Date(), 1),
        }
      }),

      // Audit log
      tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'user_created',
          entity: 'user',
          entityId: user.id,
          newValues: {
            email: userData.email,
            name: userData.name,
            provider: userData.provider
          }
        }
      })
    ]);

    return user;
  });
}

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
        // Create new user with all related records
        user = await createUserWithRelatedRecords({
          email: googleUser.email,
          name: googleUser.name,
          image: googleUser.picture,
          emailVerified: googleUser.verified ? new Date() : null,
          provider: 'google'
        });
      } else {
        // Update existing user
        await Promise.all([
          prisma.user.update({
            where: { id: user.id },
            data: { lastActive: new Date() }
          }),

          prisma.auditLog.create({
            data: {
              userId: user.id,
              action: 'user_login',
              entity: 'user',
              entityId: user.id,
            }
          })
        ]);
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
        // Create new user with all related records
        user = await createUserWithRelatedRecords({
          email,
          name,
          image,
          emailVerified: verified ? new Date() : null,
          provider: 'nextjs-google'
        });
      } else {
        // Update existing user
        await Promise.all([
          prisma.user.update({
            where: { id: user.id },
            data: {
              lastActive: new Date(),
              image, // Update profile image
            }
          }),

          prisma.auditLog.create({
            data: {
              userId: user.id,
              action: 'user_login',
              entity: 'user',
              entityId: user.id,
            }
          })
        ]);
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
          interpretationQuota: {
            select: {
              dailyCredits: true,
              weeklyCredits: true,
              nextResetDate: true,
            }
          }
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
}