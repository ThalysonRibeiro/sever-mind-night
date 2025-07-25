
import { build } from './app.ts';
import { config } from './config/env.ts';

const start = async () => {
  const fastify = await build();

  try {
    await fastify.listen({ port: config.PORT, host: '0.0.0.0' });
    fastify.log.info(`Server running at http://localhost:${config.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
