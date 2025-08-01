
import Fastify from 'fastify';
import { setupPlugins } from './plugins/index.ts';
import { config } from './config/env.ts';
import { setupRoutes } from './routes/index.ts';
import { errorHandler } from './shared/middleware/errorHandler.ts';

export const build = async () => {
  const fastify = Fastify({
    logger: {
      level: config.NODE_ENV === 'test' ? 'silent' : 'debug',
    },
  });
  fastify.setErrorHandler(errorHandler);

  await setupPlugins(fastify);
  await setupRoutes(fastify);

  return fastify;
};