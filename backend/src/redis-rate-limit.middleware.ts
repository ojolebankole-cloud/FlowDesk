import { Logger } from '@nestjs/common';
import Redis from 'ioredis';
import type { Request, Response, NextFunction } from 'express';

const logger = new Logger('RedisRateLimit');
const incrementScript = `local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('PEXPIRE',KEYS[1],ARGV[1]); end; return {n,redis.call('PTTL',KEYS[1])}`;

/** Shared, atomic rate limiting across API replicas. Production fails closed if Redis is unavailable. */
export function createRedisRateLimitMiddleware(redisUrl: string | undefined, production: boolean) {
  if (!redisUrl) {
    if (production) throw new Error('REDIS_URL is required in production; refusing process-local rate limiting.');
    logger.warn('REDIS_URL is absent; development uses the NestJS in-memory limiter.');
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }
  const redis = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1, enableReadyCheck: true, connectTimeout: 5000, retryStrategy: (times) => Math.min(times * 250, 2000) });
  void redis.connect().catch((e) => logger.error(`Redis connection failed: ${e.message}`));
  const middleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.path === '/api/v1/health/live') return next();
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const route = req.path.split('/').slice(0, 4).join('/');
      const key = `flowdesk:rl:${ip}:${req.method}:${route}`;
      const [count, ttl] = await redis.eval(incrementScript, 1, key, '60000') as [number, number];
      const limit = req.path.includes('/auth/login') || req.path.includes('/auth/register') ? 12 : req.path.includes('/ai') ? 20 : 180;
      res.setHeader('RateLimit-Limit', String(limit));
      res.setHeader('RateLimit-Remaining', String(Math.max(0, limit - Number(count))));
      if (Number(count) > limit) {
        res.setHeader('Retry-After', String(Math.max(1, Math.ceil(Number(ttl) / 1000))));
        res.status(429).json({ statusCode: 429, message: 'Too many requests. Please retry later.' });
        return;
      }
      next();
    } catch (error) {
      logger.error(`Rate-limit store unavailable: ${(error as Error).message}`);
      if (production) { res.status(503).json({ statusCode: 503, message: 'Request protection is temporarily unavailable.' }); return; }
      next();
    }
  };
  (middleware as any).close = () => redis.quit();
  return middleware;
}
