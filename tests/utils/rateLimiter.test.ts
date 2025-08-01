import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  getRateLimiterForUser,
  getRateLimiterForOperation,
  shouldBypassRateLimit,
  clearRateLimit,
  checkRedisHealth,
  getRateLimitStats,
  redis,
  ratelimit,
  authRateLimit,
  publicApiRateLimit,
  uploadRateLimit,
  premiumRateLimit,
  endpointConfigs
} from '../../src/utils/rateLimiter.ts';

// Mock do Redis e Ratelimit
jest.mock('@upstash/redis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      ping: jest.fn().mockResolvedValue('PONG'),
      keys: jest.fn().mockResolvedValue(['key1', 'key2']),
      del: jest.fn().mockResolvedValue(2),
      get: jest.fn().mockResolvedValue(5)
    }))
  };
});

jest.mock('@upstash/ratelimit', () => {
  const mockRatelimit = jest.fn().mockImplementation(() => ({
    limit: jest.fn().mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000
    })
  }));
  
  // Adicionar o método estático slidingWindow
  mockRatelimit.slidingWindow = jest.fn().mockReturnValue({});
  
  return {
    Ratelimit: mockRatelimit
  };
});

describe('rateLimiter utils', () => {
  beforeEach(() => {
    // Limpar mocks entre testes
    jest.clearAllMocks();
    
    // Restaurar variáveis de ambiente
    process.env.NODE_ENV = 'test';
    process.env.BYPASS_RATE_LIMIT = 'false';
    process.env.ADMIN_IPS = '';
  });

  describe('getRateLimiterForUser', () => {
    it('should return premium rate limiter for premium users', () => {
      expect(getRateLimiterForUser('premium')).toBe(premiumRateLimit);
      expect(getRateLimiterForUser('PREMIUM')).toBe(premiumRateLimit);
    });

    it('should return premium rate limiter for paid users', () => {
      expect(getRateLimiterForUser('paid')).toBe(premiumRateLimit);
      expect(getRateLimiterForUser('PAID')).toBe(premiumRateLimit);
    });

    it('should return premium rate limiter for admin users', () => {
      expect(getRateLimiterForUser('admin')).toBe(premiumRateLimit);
      expect(getRateLimiterForUser('ADMIN')).toBe(premiumRateLimit);
    });

    it('should return default rate limiter for other user types', () => {
      expect(getRateLimiterForUser('free')).toBe(ratelimit);
      expect(getRateLimiterForUser('user')).toBe(ratelimit);
      expect(getRateLimiterForUser(undefined)).toBe(ratelimit);
    });
  });

  describe('getRateLimiterForOperation', () => {
    it('should return auth rate limiter for auth operations', () => {
      expect(getRateLimiterForOperation('auth')).toBe(authRateLimit);
      expect(getRateLimiterForOperation('login')).toBe(authRateLimit);
      expect(getRateLimiterForOperation('register')).toBe(authRateLimit);
    });

    it('should return upload rate limiter for upload operations', () => {
      expect(getRateLimiterForOperation('upload')).toBe(uploadRateLimit);
      expect(getRateLimiterForOperation('file')).toBe(uploadRateLimit);
    });

    it('should return public API rate limiter for public operations', () => {
      expect(getRateLimiterForOperation('public')).toBe(publicApiRateLimit);
      expect(getRateLimiterForOperation('search')).toBe(publicApiRateLimit);
    });

    it('should return default rate limiter for other operations', () => {
      expect(getRateLimiterForOperation('other')).toBe(ratelimit);
      expect(getRateLimiterForOperation('unknown')).toBe(ratelimit);
    });
  });

  describe('shouldBypassRateLimit', () => {
    it('should bypass rate limit in development with BYPASS_RATE_LIMIT=true', () => {
      process.env.NODE_ENV = 'development';
      process.env.BYPASS_RATE_LIMIT = 'true';
      
      expect(shouldBypassRateLimit()).toBe(true);
    });

    it('should not bypass rate limit in development with BYPASS_RATE_LIMIT=false', () => {
      process.env.NODE_ENV = 'development';
      process.env.BYPASS_RATE_LIMIT = 'false';
      
      expect(shouldBypassRateLimit()).toBe(false);
    });

    it('should not bypass rate limit in production regardless of BYPASS_RATE_LIMIT', () => {
      process.env.NODE_ENV = 'production';
      process.env.BYPASS_RATE_LIMIT = 'true';
      
      expect(shouldBypassRateLimit()).toBe(false);
    });

    it('should bypass rate limit for admin IPs', () => {
      process.env.ADMIN_IPS = '127.0.0.1,192.168.1.1';
      const request = { ip: '127.0.0.1' };
      
      expect(shouldBypassRateLimit(request)).toBe(true);
    });

    it('should not bypass rate limit for non-admin IPs', () => {
      process.env.ADMIN_IPS = '127.0.0.1,192.168.1.1';
      const request = { ip: '10.0.0.1' };
      
      expect(shouldBypassRateLimit(request)).toBe(false);
    });
  });

  describe('clearRateLimit', () => {
    it('should clear rate limits successfully', async () => {
      // Configurar o mock para retornar chaves
      redis.keys = jest.fn().mockResolvedValue(['key1', 'key2']);
      
      const result = await clearRateLimit('user_123');
      
      expect(redis.keys).toHaveBeenCalledWith('rl_general:user_123*');
      expect(redis.del).toHaveBeenCalledWith('key1', 'key2');
      expect(result).toBe(true);
    });

    it('should handle errors when clearing rate limits', async () => {
      // Mock console.error para evitar logs durante o teste
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Forçar um erro
      redis.keys = jest.fn().mockRejectedValue(new Error('Redis error'));
      
      const result = await clearRateLimit('user_123');
      
      expect(console.error).toHaveBeenCalled();
      expect(result).toBe(false);
      
      // Restaurar console.error
      console.error = originalConsoleError;
    });
  });

  describe('checkRedisHealth', () => {
    it('should return true when Redis is healthy', async () => {
      redis.ping = jest.fn().mockResolvedValue('PONG');
      
      const result = await checkRedisHealth();
      
      expect(redis.ping).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when Redis is not healthy', async () => {
      // Mock console.error para evitar logs durante o teste
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      redis.ping = jest.fn().mockRejectedValue(new Error('Redis error'));
      
      const result = await checkRedisHealth();
      
      expect(redis.ping).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      expect(result).toBe(false);
      
      // Restaurar console.error
      console.error = originalConsoleError;
    });
  });

  describe('getRateLimitStats', () => {
    it('should return rate limit stats', async () => {
      const mockResult = {
        success: true,
        remaining: 99,
        reset: Date.now() + 60000,
        limit: 100
      };
      
      ratelimit.limit = jest.fn().mockResolvedValue(mockResult);
      redis.get = jest.fn().mockResolvedValue('5'); // Redis retorna strings
      
      const result = await getRateLimitStats('user_123');
      
      expect(ratelimit.limit).toHaveBeenCalledWith('user_123');
      expect(redis.get).toHaveBeenCalledWith('rl_general:user_123');
      expect(result).toEqual({
        ...mockResult,
        current: 5
      });
    });

    it('should handle errors when getting rate limit stats', async () => {
      // Mock console.error para evitar logs durante o teste
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      ratelimit.limit = jest.fn().mockRejectedValue(new Error('Rate limit error'));
      
      const result = await getRateLimitStats('user_123');
      
      expect(console.error).toHaveBeenCalled();
      expect(result).toBe(null);
      
      // Restaurar console.error
      console.error = originalConsoleError;
    });
  });

  describe('endpointConfigs', () => {
    it('should have correct rate limiters for specific endpoints', () => {
      expect(endpointConfigs['/api/auth/login']).toBe(authRateLimit);
      expect(endpointConfigs['/api/auth/register']).toBe(authRateLimit);
      expect(endpointConfigs['/api/upload']).toBe(uploadRateLimit);
      expect(endpointConfigs['/api/public']).toBe(publicApiRateLimit);
    });
  });
});