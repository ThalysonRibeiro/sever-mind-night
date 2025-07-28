import type { FastifyInstance } from 'fastify'
import { authRoutes } from '../features/auth/auth.routes.ts'

export const setupRoutes = async (fastify: FastifyInstance) => {
  // Health check
  fastify.get('/', {
  }, async () => {
    return { status: 'ok' }
  });

  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  });

  fastify.get('/editor-stuff', {
    preHandler: [
      fastify.authenticate, // ← Primeiro verifica se está logado (401)
      fastify.verifyRole('USER') // ← Depois verifica permissão (403)
    ]
  }, async (request, reply) => {
    return { message: 'You are an editor!' }
  });





  // Auth routes
  await fastify.register(authRoutes, { prefix: '/auth' })
}



// / Exemplo em um arquivo como src/routes/alguma-rota.ts
//     2 import { FastifyInstance } from 'fastify'
//     3
//     4 export async function minhasRotasProtegidas(app: FastifyInstance) {
//     5
//     6   app.get('/dados-secretos', {
//     7     // É AQUI QUE A MÁGICA ACONTECE!
//     8     preHandler: [app.authenticate]
//     9   }, async (request, reply) => {
//    10
//    11     // Se o código chegou até aqui, o token é válido.
//    12     // Graças ao fastify.d.ts, o TypeScript sabe que `request.user` existe.
//    13     const userId = request.user.userId;
//    14     console.log(`Acessando dados secretos para o usuário: ${userId}`);
//    15
//    16     // ...sua lógica para buscar os dados secretos...
//    17
//    18     return { data: 'informação super secreta', user: request.user };
//    19   });
//    20
//    21 }