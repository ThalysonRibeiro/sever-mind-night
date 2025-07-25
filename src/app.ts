
import Fastify from 'fastify';
import { setupRoutes } from './routes/index.ts';
import { setupPlugins } from './plugins/index.ts';
import { config } from './config/env.ts';

export const build = async () => {
  const fastify = Fastify({
    logger: {
      level: config.NODE_ENV === 'test' ? 'silent' : 'debug',
    },
  });

  await setupPlugins(fastify);
  await setupRoutes(fastify);

  return fastify;
};
