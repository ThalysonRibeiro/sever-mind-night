import { build } from '../../src/app.ts'
import type { FastifyInstance } from 'fastify'

export const getAuthToken = async (
  fastify: FastifyInstance,
  userId: string,
  role: 'USER' | 'ADMIN' = 'USER',
  plan: string = 'FREE'
): Promise<string> => {
  const payload = {
    userId,
    email: `test-${userId}@example.com`,
    role,
    plan,
  };

  const token = fastify.jwt.sign(payload, { expiresIn: '7d' });
  return token;
};


export const createTestApp = async (): Promise<FastifyInstance> => {
  // Use a mesma função build do app, mas em modo test
  process.env.NODE_ENV = 'test'

  const app = await build()

  // Aguarda o app estar pronto para receber requests
  await app.ready()

  return app
}

export const closeTestApp = async (app: FastifyInstance) => {
  await app.close()
}

// Mock do Prisma para testes (opcional)
export const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
  userSettings: {
    create: jest.fn(),
  },
  userStats: {
    create: jest.fn(),
  },
  interpretationQuota: {
    create: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
}