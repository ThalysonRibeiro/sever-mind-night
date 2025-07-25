
import { FastifyInstance } from 'fastify';

export const getAuthToken = async (fastify: FastifyInstance, userId: string, role: 'USER' | 'ADMIN') => {
  return fastify.jwt.sign({ userId, role, email: 'test@example.com', plan: 'FREE' });
};
