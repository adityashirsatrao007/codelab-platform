import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Custom database-backed rate limiter middleware
export const createDbRateLimiter = (options: {
  windowMs: number;
  max: number;
  message: { error: string };
  keyGenerator?: (req: Request) => string;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Default key generator: User ID > IP > 'anonymous'
      const identifier = options.keyGenerator
        ? options.keyGenerator(req)
        : (req as any).user?.id || req.ip || 'anonymous';
      
      // Use the route path as the endpoint identifier or fallback
      const endpoint = req.baseUrl + req.path;

      const result = await checkRateLimit(
        identifier,
        endpoint,
        options.max,
        options.windowMs
      );

      // Set standard rate limit headers
      res.setHeader('X-RateLimit-Limit', options.max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, result.remaining));
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt.getTime() / 1000));

      if (!result.allowed) {
        return res.status(429).json(options.message);
      }

      next();
    } catch (error) {
      console.error('Rate limiter middleware error:', error);
      // Fail open to avoid blocking legitimate traffic on error
      next();
    }
  };
};

// Custom database-backed rate limiter logic
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  try {
    // Get or create rate limit record
    // Note: We use upsert logic manually or transactionally to ensure correctness
    
    // First, clean up old record if it exists but is expired? 
    // Actually, simply checking windowStart is enough.
    
    const record = await prisma.rateLimit.findUnique({
      where: {
        identifier_endpoint: { identifier, endpoint }
      }
    });

    if (!record || record.windowStart < windowStart) {
      // New window or expired window
      await prisma.rateLimit.upsert({
        where: {
          identifier_endpoint: { identifier, endpoint }
        },
        update: {
          count: 1,
          windowStart: now
        },
        create: {
          identifier: identifier,
          endpoint: endpoint,
          count: 1,
          windowStart: now
        }
      });

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: new Date(now.getTime() + windowMs)
      };
    }

    if (record.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(record.windowStart.getTime() + windowMs) 
      };
    }

    // Increment
    await prisma.rateLimit.update({
      where: {
        identifier_endpoint: { identifier, endpoint }
      },
      data: {
        count: { increment: 1 }
      }
    });

    return {
      allowed: true,
      remaining: maxRequests - record.count - 1,
      resetAt: new Date(record.windowStart.getTime() + windowMs)
    };

  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open
    return { allowed: true, remaining: maxRequests, resetAt: now };
  }
}

// Cleanup old rate limit records (run periodically or via cron)
export async function cleanupRateLimits() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  try {
    await prisma.rateLimit.deleteMany({
      where: {
        windowStart: { lt: cutoff }
      }
    });
  } catch (error) {
    console.error('Rate limit cleanup error:', error);
  }
}

// --- EXPORTED LIMITERS ---

// General API rate limiter
export const generalLimiter = createDbRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: { error: 'Too many requests, please try again later.' },
});

// Strict rate limiter for code submissions (10 per hour)
export const submissionLimiter = createDbRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.SUBMISSION_RATE_LIMIT || '10'),
  message: { error: 'Submission limit reached. Try again in an hour.' },
});

// Auth rate limiter (prevent brute force)
export const authLimiter = createDbRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: { error: 'Too many login attempts. Please try again later.' },
  keyGenerator: (req: Request) => req.body.email || req.ip || 'anonymous', // Limit by email for login
});

// Code run rate limiter (30 per minute for testing)
export const runCodeLimiter = createDbRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { error: 'Too many code executions. Please wait a moment.' },
});


