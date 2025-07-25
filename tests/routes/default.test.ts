import supertest from 'supertest';
import { FastifyInstance } from 'fastify';
import { build } from '../../src/app.ts';

describe('Default Routes', () => {
  let fastify: FastifyInstance;

  beforeAll(async () => {
    fastify = await build();
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  test('GET / should return 200', async () => {
    const response = await supertest(fastify.server).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  test('GET /health should return 200', async () => {
    const response = await supertest(fastify.server).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('GET /editor-stuff should return 401 without auth', async () => {
    const response = await supertest(fastify.server).get('/editor-stuff');
    expect(response.status).toBe(403);
  });
});