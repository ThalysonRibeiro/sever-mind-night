import '@fastify/jwt'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: string
      email: string
      plan: string
      role: 'USER' | 'ADMIN'
    }
    user: {
      userId: string
      email: string
      plan: string
      role: 'USER' | 'ADMIN'
    }
  }
}

declare module 'fastify' {
  export interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    verifyRole: (role: string) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    verifyAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}