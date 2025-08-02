import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Configuração do Redis
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Configurações flexíveis por ambiente
const getRateLimitConfig = () => {
  const env = process.env.NODE_ENV || 'development'

  switch (env) {
    case 'production':
      return {
        requests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100'),
        window: process.env.RATE_LIMIT_WINDOW || '1 m',
        analytics: true
      }
    case 'development':
      return {
        requests: parseInt(process.env.RATE_LIMIT_REQUESTS || '1000'),
        window: process.env.RATE_LIMIT_WINDOW || '1 m',
        analytics: false
      }
    case 'test':
      return {
        // Configuração muito permissiva para testes
        // Praticamente desativa o rate limiting
        requests: 10000,
        window: '1 s',
        analytics: false
      }
    default:
      return {
        requests: 100,
        window: '1 m',
        analytics: true
      }
  }
}

const config = getRateLimitConfig()

// Rate limiters específicos para diferentes casos de uso
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(config.requests, config.window as any), // Fix: cast para any
  analytics: config.analytics,
  prefix: 'rl_general',
});

// Rate limiter para autenticação (mais restritivo)
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m' as any), // Fix: cast para any
  analytics: config.analytics,
  prefix: 'rl_auth',
});

// Rate limiter para APIs públicas (menos restritivo)
export const publicApiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '1 h' as any), // Fix: cast para any
  analytics: config.analytics,
  prefix: 'rl_public',
});

// Rate limiter para uploads (muito restritivo)
export const uploadRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h' as any), // Fix: cast para any
  analytics: config.analytics,
  prefix: 'rl_upload',
});

// Rate limiter premium/paid users (mais generoso)
export const premiumRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10000, '1 h' as any), // Fix: cast para any
  analytics: config.analytics,
  prefix: 'rl_premium',
});

// Função helper para identificar o tipo de usuário
export const getRateLimiterForUser = (userType?: string) => {
  switch (userType?.toLowerCase()) {
    case 'premium':
    case 'paid':
      return premiumRateLimit
    case 'admin':
      return premiumRateLimit // Admins têm limites altos
    default:
      return ratelimit
  }
}

// Função helper para diferentes tipos de operação
export const getRateLimiterForOperation = (operation: string) => {
  switch (operation.toLowerCase()) {
    case 'auth':
    case 'login':
    case 'register':
      return authRateLimit
    case 'upload':
    case 'file':
      return uploadRateLimit
    case 'public':
    case 'search':
      return publicApiRateLimit
    default:
      return ratelimit
  }
}

// Função utilitária para bypass em desenvolvimento
export const shouldBypassRateLimit = (request?: any): boolean => {
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_RATE_LIMIT === 'true') {
    return true
  }

  // Bypass para IPs de admin em produção (opcional)
  const adminIPs = process.env.ADMIN_IPS?.split(',').map(ip => ip.trim()) || []
  if (adminIPs.length > 0 && request?.ip && adminIPs.includes(request.ip)) {
    return true
  }

  return false
}

// Função para limpar rate limits (útil para testes ou admin)
export const clearRateLimit = async (identifier: string, prefix = 'rl_general') => {
  try {
    const keys = await redis.keys(`${prefix}:${identifier}*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
    return true
  } catch (error) {
    console.error('Error clearing rate limit:', error)
    return false
  }
}

// Health check do Redis
export const checkRedisHealth = async (): Promise<boolean> => {
  // Em ambiente de teste, sempre retorna true para evitar conexões reais
  if (process.env.NODE_ENV === 'test' || process.env.BYPASS_RATE_LIMIT === 'true') {
    return true
  }
  
  try {
    const result = await redis.ping()
    return result === 'PONG'
  } catch (error) {
    console.error('Redis health check failed:', error)
    return false
  }
}

// Estatísticas de rate limiting (útil para monitoring)
export const getRateLimitStats = async (identifier: string, prefix = 'rl_general') => {
  try {
    // Upstash não tem dryRun, então vamos verificar de outra forma
    const result = await ratelimit.limit(identifier)

    // Se ainda tem remaining, não foi consumido efetivamente
    // Para uma verificação real sem consumir, podemos usar Redis diretamente
    const key = `${prefix}:${identifier}`
    const current = await redis.get(key) || 0

    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
      limit: result.limit,
      current: typeof current === 'number' ? current : parseInt(current as string) || 0
    }
  } catch (error) {
    console.error('Error getting rate limit stats:', error)
    return null
  }
}

// Configuração para diferentes endpoints
export const endpointConfigs = {
  '/api/auth/login': authRateLimit,
  '/api/auth/register': authRateLimit,
  '/api/upload': uploadRateLimit,
  '/api/public': publicApiRateLimit,
} as const

// Tipo para os endpoints configurados
export type ConfiguredEndpoint = keyof typeof endpointConfigs

// Export da configuração atual para debugging
export const currentConfig = {
  environment: process.env.NODE_ENV,
  config,
  redisUrl: process.env.UPSTASH_REDIS_REST_URL ? 'configured' : 'missing',
  redisToken: process.env.UPSTASH_REDIS_REST_TOKEN ? 'configured' : 'missing',
}