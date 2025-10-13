import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

// In-memory store for rate limiting (in production, use Redis or similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): RateLimitResult {
  // In Next.js app router, get IP from headers
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   request.headers.get('cf-connecting-ip') ||
                   'unknown';
  const key = `${clientIP}:${new URL(request.url).pathname}`;
  const now = Date.now();
  const windowMs = config.windowMs;

  // Get or create request count for this key
  let requestData = requestCounts.get(key);

  if (!requestData || now > requestData.resetTime) {
    // Reset window
    requestData = {
      count: 0,
      resetTime: now + windowMs
    };
    requestCounts.set(key, requestData);
  }

  requestData.count++;

  const resetTime = requestData.resetTime;
  const remaining = Math.max(0, config.maxRequests - requestData.count);

  return {
    success: requestData.count <= config.maxRequests,
    limit: config.maxRequests,
    remaining,
    resetTime
  };
}

// Cleanup old entries periodically (simple cleanup every hour)
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now > data.resetTime + 60000) { // Remove after 1 minute past reset
      requestCounts.delete(key);
    }
  }
}, 3600000); // Run every hour
