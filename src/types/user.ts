export interface UserPayload {
  userId: string;
  email: string;
  plan: string;
  role: 'USER' | 'ADMIN';
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

// Se você quiser adicionar mais planos no futuro
export type UserPlan = string; // Flexível para qualquer string

// Os tipos já estão declarados no seu fastify.d.ts, então não precisamos redeclarar
// Apenas exportamos os tipos para reutilização