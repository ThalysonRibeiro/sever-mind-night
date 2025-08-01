import { prisma } from '../../lib/prisma.ts'
import { getGoogleUserInfo, getGoogleAuthUrl } from '../../lib/google-auth.ts'
import { addWeeks } from 'date-fns'
import { PLANS_INTERPRETATION_QUOTA } from '../../utils/constants.ts'
import bcrypt from 'bcrypt'
import { createAdminSchema } from './auth.types.ts' // Importar o schema para validação no serviço
import { UnauthorizedError, UserAlreadyExistsError, ValidationError } from '../../shared/errors/AppError.ts'
import { isValidEmail } from '../../utils/emailValidation.ts'

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

export const authService = {
  getGoogleAuthUrl: () => {
    return getGoogleAuthUrl();
  },

  async handleGoogleCallback(code: string) {
    const googleUser = await getGoogleUserInfo(code);

    let user = await prisma.user.findUnique({
      where: { email: googleUser.email }
    });

    if (!user) {
      user = await createUserWithRelatedRecords({
        email: googleUser.email,
        name: googleUser.name,
        image: googleUser.picture,
        emailVerified: googleUser.verified ? new Date() : null,
        provider: 'google'
      });
    } else {
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
    return user;
  },

  async handleNextjsSignin(email: string, name: string | undefined, image: string | undefined, verified: boolean) {
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      user = await createUserWithRelatedRecords({
        email,
        name,
        image,
        emailVerified: verified ? new Date() : null,
        provider: 'nextjs-google'
      });
    } else {
      await Promise.all([
        prisma.user.update({
          where: { id: user.id },
          data: {
            lastActive: new Date(),
            image,
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
    return user;
  },

  async logoutUser(userId: string | undefined) {
    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId: userId,
          action: 'user_logout',
          entity: 'user',
          entityId: userId,
        }
      });
    }
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
    });
    return user;
  },

  async createAdmin(adminSecret: string, email: string, password: string, name: string | undefined, phone: string | undefined) {
    if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
      throw new UnauthorizedError('Invalid or missing admin secret');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new UserAlreadyExistsError(`User with email ${email} already exists`);
    }

    if (!isValidEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        phone,
        role: 'ADMIN',
        plan: 'PREMIUM',
        lastActive: new Date(),
      }
    });

    await Promise.all([
      prisma.userSettings.create({ data: { userId: user.id } }),
      prisma.userStats.create({ data: { userId: user.id } }),
      prisma.interpretationQuota.create({
        data: {
          userId: user.id,
          dailyCredits: PLANS_INTERPRETATION_QUOTA[user.plan].dailyCredits,
          weeklyCredits: PLANS_INTERPRETATION_QUOTA[user.plan].weeklyCredits,
          nextResetDate: addWeeks(new Date(), 1),
        }
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'user_created',
          entity: 'user',
          entityId: user.id,
          newValues: {
            email: email,
            name: name,
            provider: 'credentials'
          }
        }
      })
    ]);
    return user;
  },

  async getAdminUsers() {
    const usersAdmin = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      }
    });
    return usersAdmin;
  }
};