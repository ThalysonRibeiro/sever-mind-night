import Fastify from 'fastify'
import { setupRoutes } from './routes/index.ts'
import { setupPlugins } from './plugins/index.ts'
import { config } from './config/env.ts'

const fastify = Fastify({
  logger: {
    level: config.NODE_ENV === 'production' ? 'info' : 'debug'
  }
})

const start = async () => {
  try {
    // Setup plugins
    await setupPlugins(fastify)

    // Setup routes
    await setupRoutes(fastify)

    // Start server
    await fastify.listen({
      port: config.PORT,
      host: '0.0.0.0'
    })

    fastify.log.info(`Server running at http://localhost:${config.PORT}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await fastify.close()
    fastify.log.info('Server closed')
    process.exit(0)
  } catch (err) {
    fastify.log.error('Error closing server', err)
    process.exit(1)
  }
})

start()