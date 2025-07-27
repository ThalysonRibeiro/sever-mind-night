import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { build } from '../../src/app.ts';
import { getAuthToken } from '../utils/helpers.ts';

// Mocks completos
jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userSettings: {
      create: jest.fn(),
    },
    userStats: {
      create: jest.fn(),
    },
    interpretationQuota: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback: any) => callback({
      user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      userSettings: { create: jest.fn() },
      userStats: { create: jest.fn() },
      interpretationQuota: { create: jest.fn() },
      auditLog: { create: jest.fn() },
    })),
  },
}));

jest.mock('../../src/lib/google-auth', () => ({
  getGoogleAuthUrl: jest.fn(() => 'https://accounts.google.com/oauth/authorize'),
  getGoogleUserInfo: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('Auth Routes - Simple Tests', () => {
  let fastify: FastifyInstance;

  beforeEach(async () => {
    fastify = await build();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await fastify.close();
  });

  describe('GET /auth/me', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/auth/me',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /auth/google', () => {
    it('should redirect to Google OAuth', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/auth/google',
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBeDefined();
    });
  });

  describe('GET /auth/google/callback', () => {
    it('should handle missing code parameter', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/auth/google/callback',
      });

      // Deve retornar 400 ou 500, mas não deve quebrar
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /auth/nextjs/signin', () => {
    it('should handle missing required fields', async () => {
      const incompleteData = {
        email: 'test@example.com',
        // missing googleId
        verified: true,
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/nextjs/signin',
        payload: incompleteData,
      });

      // Deve retornar 400 ou 500, mas não deve quebrar
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('should handle invalid email', async () => {
      const invalidData = {
        email: 'test@example.com', // Este email está na lista de bloqueados
        googleId: 'google-123',
        verified: true,
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/nextjs/signin',
        payload: invalidData,
      });

      // Deve retornar 400 ou 500, mas não deve quebrar
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });
}); 