import type { FastifyRequest, FastifyReply } from 'fastify'

// Usar os tipos do seu fastify.d.ts
type UserPayload = {
  userId: string;
  email: string;
  plan: string;
  role: 'USER' | 'ADMIN';
}

// Substituir enum por const assertion - compatível com strip-only mode
export const UserRole = {
  ADMIN: 'ADMIN',
  USER: 'USER'
} as const

// Tipo derivado do objeto (opcional, para type safety)
export type UserRoleType = typeof UserRole[keyof typeof UserRole]

export function verifyRole(requiredRole: string | string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user // Já tipado pelo fastify.d.ts

      // Verificar se o usuário existe
      if (!user) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        })
      }

      // Suportar múltiplas roles
      const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
      const hasPermission = allowedRoles.some(role =>
        user.role.toUpperCase() === role.toUpperCase()
      )

      if (!hasPermission) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: `Required role(s): ${allowedRoles.join(', ')}. Current role: ${user.role}`,
        })
      }

      // Log para auditoria (opcional)
      request.log.info({
        userId: user.userId,
        userRole: user.role,
        requiredRole,
        action: 'role_verification_success'
      })

    } catch (error) {
      request.log.error({ error }, 'Error in role verification')
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Role verification failed',
      })
    }
  }
}

// Helpers para roles específicas
export const verifyAdmin = verifyRole(UserRole.ADMIN)
// export const verifyModerator = verifyRole([UserRole.ADMIN, UserRole.MODERATOR])