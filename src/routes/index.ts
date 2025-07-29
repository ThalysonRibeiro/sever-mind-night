// routes/index.ts
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

export const setupRoutes = async (fastify: FastifyInstance) => {
  // Registrar todas as rotas com o type provider
  const server = fastify.withTypeProvider<ZodTypeProvider>()

  // Registrar rotas de auth
  await server.register(async function (fastify) {
    const { authRoutes } = await import('./auth/index.ts')
    await fastify.register(authRoutes, { prefix: '/auth' })
  })

  // Registrar outras rotas se houver
  // await server.register(async function (fastify) {
  //   const { otherRoutes } = await import('./other/index.ts')
  //   await fastify.register(otherRoutes, { prefix: '/api' })
  // })
}