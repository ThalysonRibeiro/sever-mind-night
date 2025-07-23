import type { FastifyInstance } from 'fastify'
import { authRoutes } from './auth/index.ts'
import z from 'zod'

// const meResponseSchema = z.object({
//   user: z.object({
//     userId: z.string(),
//     email: z.string().email(),
//     plan: z.string(),
//     role: z.string(),
//   })
// })
export const setupRoutes = async (fastify: FastifyInstance) => {
  // Health check
  fastify.get('/', {
    // schema: {
    //   summary: 'Busca os dados do usuário autenticado',
    //   description: 'Retorna as informações do usuário contidas no token JWT.',
    //   tags: ['auth'], // Agrupa a rota na seção "auth" no Swagger
    //   security: [{ Bearer: [] }], // Indica que precisa de autenticação
    //   response: {
    //     200: meResponseSchema, // Mapeia o schema Zod para a resposta 200 OK
    //     401: z.object({ error: z.string() }) // Exemplo de resposta de erro
    //   }
    // }
  }, async () => {
    return { status: 'ok' }
  })
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })



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