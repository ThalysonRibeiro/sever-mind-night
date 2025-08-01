export interface RateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
  skipRoutes?: string[];
  enableLogs?: boolean;
  bypassInDev?: boolean;
}

export const defaultRateLimitConfig: RateLimitOptions = {
  maxRequests: 100,
  windowMs: 60000, // 1 minuto
  skipRoutes: ['/docs', '/health', '/metrics'],
  enableLogs: process.env.NODE_ENV === 'development',
  bypassInDev: process.env.BYPASS_RATE_LIMIT === 'true'
}