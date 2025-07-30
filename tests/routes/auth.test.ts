// tests/routes/auth.test.ts
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals'
import type { FastifyInstance } from 'fastify'
import { closeTestApp, createTestApp } from '../utils/helpers.ts'
import { authService } from '../../src/features/auth/auth.service.ts'

// Mock do authService
jest.mock('../../src/features/auth/auth.service.ts', () => ({
  authService: {
    handleNextjsSignin: jest.fn(),
    getGoogleAuthUrl: jest.fn(() => 'https://accounts.google.com/oauth/authorize'),
    handleGoogleCallback: jest.fn(),
    logoutUser: jest.fn(),
    getMe: jest.fn(),
  },
}))

describe('Auth Routes', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await closeTestApp(app)
  })

  describe('POST /auth/nextjs/signin', () => {
    it('should create new user on first signin', async () => {
      const payload = {
        email: 'test@example.com',
        name: 'Test User',
        googleId: '123456789',
        verified: true,
        image: 'https://example.com/avatar.jpg',
      }

      const mockUser = {
        id: 'user-1',
        ...payload,
        plan: 'TRIAL',
        role: 'USER',
      }

      // @ts-ignore
      authService.handleNextjsSignin.mockResolvedValue(mockUser)

      const response = await app.inject({
        method: 'POST',
        url: '/auth/nextjs/signin',
        payload,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.user.email).toBe(payload.email)
      expect(authService.handleNextjsSignin).toHaveBeenCalledWith(
        payload.email,
        payload.name,
        payload.image,
        payload.verified
      )
    })

    it('should return existing user on subsequent signin', async () => {
      const payload = {
        email: 'existing@example.com',
        name: 'Existing User',
        googleId: '987654321',
        verified: true,
      }
      const mockUser = { id: 'user-2', ...payload, plan: 'TRIAL', role: 'USER' }

      // @ts-ignore
      authService.handleNextjsSignin.mockResolvedValue(mockUser)

      // Primeira chamada
      await app.inject({
        method: 'POST',
        url: '/auth/nextjs/signin',
        payload,
      })

      // Segunda chamada
      const response = await app.inject({
        method: 'POST',
        url: '/auth/nextjs/signin',
        payload,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.user.id).toBe(mockUser.id) // Garante que o mesmo usuário foi retornado
    })
  })

  describe('GET /auth/google', () => {
    it('should redirect to Google OAuth', async () => {
      // @ts-ignore
      authService.getGoogleAuthUrl.mockReturnValue('https://accounts.google.com/oauth/authorize')

      const response = await app.inject({
        method: 'GET',
        url: '/auth/google',
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('https://accounts.google.com/oauth/authorize')
    })
  })

  describe('GET /auth/google/callback', () => {
    it('should handle successful callback', async () => {
      const mockUser = {
        id: 'user-3',
        email: 'google@example.com',
        plan: 'TRIAL',
        role: 'USER',
      }
      // @ts-ignore
      authService.handleGoogleCallback.mockResolvedValue(mockUser)

      const response = await app.inject({
        method: 'GET',
        url: '/auth/google/callback?code=mock-code',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.user.id).toBe(mockUser.id)
      expect(authService.handleGoogleCallback).toHaveBeenCalledWith('mock-code')
    })
  })

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.message).toBe('Logged out successfully')
    })
  })

  describe('GET /auth/me', () => {
    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return user data when authenticated', async () => {
      const mockUser = {
        id: 'user-4',
        email: 'me@example.com',
        plan: 'PREMIUM',
        role: 'USER',
      }
      // @ts-ignore
      authService.getMe.mockResolvedValue(mockUser)

      const token = app.jwt.sign({
        userId: mockUser.id,
        email: mockUser.email,
        plan: mockUser.plan as 'TRIAL' | 'PREMIUM', // Cast to valid plan type
        role: mockUser.role as 'USER' | 'ADMIN',
      })

      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: `Bearer ${token}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.user.id).toBe(mockUser.id)
      expect(authService.getMe).toHaveBeenCalledWith(mockUser.id)
    })
  })
})
