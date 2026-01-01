import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Note: In serverless, the store resets per invocation anyway
// For production with high traffic, use Redis or similar

export interface RateLimiterOptions {
  windowMs?: number; // Time window in milliseconds
  max?: number; // Max requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

export function createRateLimiter(options: RateLimiterOptions = {}) {
  const {
    windowMs = 60 * 1000, // 1 minute default
    max = 60, // 60 requests per minute default (doubled from typical 30)
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    keyGenerator = (req: Request) => {
      // Use IP address or user ID from context
      const ip = (req as any).ip || (req as any).headers?.['x-forwarded-for']?.toString() || 'unknown';
      return ip;
    }
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    store[key].count++;

    const remaining = Math.max(0, max - store[key].count);
    const resetTime = Math.ceil((store[key].resetTime - now) / 1000);

    // Set rate limit headers
    (res as any).setHeader('X-RateLimit-Limit', max.toString());
    (res as any).setHeader('X-RateLimit-Remaining', remaining.toString());
    (res as any).setHeader('X-RateLimit-Reset', resetTime.toString());

    if (store[key].count > max) {
      (res as any).setHeader('Retry-After', resetTime.toString());
      return (res as any).status(429).json({
        error: message,
        retryAfter: resetTime
      });
    }

    // If skipSuccessfulRequests, decrement on successful response
    if (skipSuccessfulRequests) {
      const originalSend = (res as any).send;
      (res as any).send = function (this: any, data: any) {
        if ((res as any).statusCode < 400) {
          store[key].count = Math.max(0, store[key].count - 1);
        }
        return originalSend.call(this, data);
      };
    }

    (next as any)();
  };
}

// Pre-configured rate limiters for different use cases
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Doubled: 100 requests per minute
  message: 'API rate limit exceeded. Please try again in a minute.',
  skipSuccessfulRequests: true
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again later.'
});

export const analysisRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Doubled: 20 analyses per hour (was typically 10)
  message: 'Analysis creation limit reached. Please try again later.',
  keyGenerator: (req: Request) => {
    // Use user ID from tRPC context if available
    const userId = (req as any).user?.id || req.ip || 'guest';
    return `analysis:${userId}`;
  }
});
