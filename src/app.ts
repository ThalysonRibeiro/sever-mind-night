
import Fastify from 'fastify';
import { setupPlugins } from './plugins/index.ts';
import { config } from './config/env.ts';
import { setupRoutes } from './routes/index.ts';

export const build = async () => {
  const fastify = Fastify({
    logger: {
      level: config.NODE_ENV === 'test' ? 'silent' : 'debug',
    },
  });
  fastify.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    reply.status(500).send({ error: 'Internal Server Error', message: error.message });
  });

  await setupPlugins(fastify);
  await setupRoutes(fastify);

  return fastify;
};
