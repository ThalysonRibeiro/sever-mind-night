
import supertest from 'supertest';
import { FastifyInstance } from 'fastify';
import { build } from '../../src/app.ts';
import { getAuthToken } from '../utils/helpers.ts';

describe('Auth Routes', () => {
  let fastify: FastifyInstance;

  beforeAll(async () => {
    fastify = await build();
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('GET /auth/admin', () => {
    test('should return 401 without token', async () => {
      const response = await supertest(fastify.server).get('/auth/admin');
      expect(response.status).toBe(401);
    });

    test('should return 403 with non-admin token', async () => {
      const token = await getAuthToken(fastify, '1', 'USER');
      const response = await supertest(fastify.server)
        .get('/auth/admin')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(403);
    });
  });
});
