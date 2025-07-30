import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import type { FastifyInstance } from 'fastify'
import { createTestApp, closeTestApp, getAuthToken } from '../utils/helpers.ts'

describe('Main Routes', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await closeTestApp(app)
  })

  describe('GET /', () => {
    it('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/',
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.payload)).toEqual({ status: 'ok' })
    })
  })

  describe('GET /health', () => {
    it('should return health status with timestamp', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      })

      expect(response.statusCode).toBe(200)
      const payload = JSON.parse(response.payload)
      expect(payload.status).toBe('ok')
      expect(payload.timestamp).toBeDefined()
      expect(new Date(payload.timestamp)).toBeInstanceOf(Date)
    })
  })

  describe('GET /editor-stuff', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/editor-stuff',
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 403 when user is not USER role', async () => {
      const adminToken = await getAuthToken(app, 'admin-user-id', 'ADMIN')

      const response = await app.inject({
        method: 'GET',
        url: '/editor-stuff',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should return success when user has USER role', async () => {
      const userToken = await getAuthToken(app, 'user-id', 'USER')

      const response = await app.inject({
        method: 'GET',
        url: '/editor-stuff',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.payload)).toEqual({ message: 'You are an editor!' })
    })
  })
})
 