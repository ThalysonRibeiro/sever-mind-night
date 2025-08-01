import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { build } from '../../src/app.ts'
import { execSync } from 'child_process'

// Conecta ao banco de dados de teste real
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Carregado pelo script a partir do .env.e2e
    },
  },
})

describe('Auth E2E Routes', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    // Garante que o banco de dados de teste está com as migrações em dia
    execSync('npm run test:e2e:migrate')

    // Cria a instância real do app, sem mocks
    app = await build()
    await app.ready()
    await prisma.$connect()
  })

  afterAll(async () => {
    await app.close()
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Limpa as tabelas relevantes antes de cada teste para garantir o isolamento
    // A ordem é importante para evitar erros de chave estrangeira
    await prisma.account.deleteMany({})
    await prisma.session.deleteMany({})
    await prisma.user.deleteMany({})
  })

  describe('POST /auth/nextjs/signin', () => {
    it('should create a new user and save it to the database', async () => {
      const payload = {
        email: 'e2e-test@example.com',
        name: 'E2E Test User',
        googleId: 'e2e-test-google-id',
        verified: true,
        image: 'https://example.com/avatar.jpg',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/auth/nextjs/signin',
        payload,
      })

      // 1. Verifica a resposta HTTP
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.user.email).toBe(payload.email)
      expect(body.user.name).toBe(payload.name)

      // 2. Verifica se o usuário foi realmente salvo no banco de dados
      const dbUser = await prisma.user.findUnique({
        where: { email: payload.email },
      })

      expect(dbUser).not.toBeNull()
      expect(dbUser?.name).toBe(payload.name)
      expect(dbUser?.image).toBe(payload.image)
    })
  })
})
