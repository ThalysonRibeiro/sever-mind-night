
// import { FastifyInstance } from 'fastify';

// export const getAuthToken = async (fastify: FastifyInstance, userId: string, role: 'USER' | 'ADMIN') => {
//   return fastify.jwt.sign({ userId, role, email: 'test@example.com', plan: 'FREE' });
// };
// tests/utils/helpers.ts
import { FastifyInstance } from 'fastify';

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

export const createMockUser = (overrides: any = {}) => {
  return {
    id: 'mock-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    plan: 'FREE',
    image: null,
    timezone: 'UTC',
    language: 'en',
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

export const createMockAdmin = (overrides: any = {}) => {
  return createMockUser({
    role: 'ADMIN',
    plan: 'PREMIUM',
    email: 'admin@example.com',
    name: 'Admin User',
    phone: '(11) 99999-9999',
    ...overrides,
  });
};