import type { FastifyRequest, FastifyReply } from 'fastify'

type UserPayload = {
  role?: string;
  [key: string]: any;
}

export function verifyRole(role: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserPayload

    if (user?.role !== role) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'You do not have the required permissions to access this resource.',
      })
    }
  }
}
