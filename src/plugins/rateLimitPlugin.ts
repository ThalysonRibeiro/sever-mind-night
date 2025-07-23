import fp from 'fastify-plugin'
import { ratelimit } from '../utils/rateLimiter.ts'
import type { FastifyRequest, FastifyReply } from 'fastify';

export default fp(async (app) => {
  app.addHook('onRequest', async (req: FastifyRequest, reply: FastifyReply) => {
    // Ignora o rate limit para a rota de documentação
    if (req.url.startsWith('/docs')) {
      return;
    }

    const ip = req.ip //|| req.headers['x-forwarded-for'] || '';
    const { success, remaining } = await ratelimit.limit(ip);

    reply.header('X-RateLimit-Limit', 10);
    reply.header('X-RateLimit-Remaining', remaining);
    // reply.header('X-RateLimit-Reset', Math.ceil(Date.now() / 1000 + 10));

    if (!success) {
      reply.status(429).send({ error: 'Too many requests' })
    }
  })
})