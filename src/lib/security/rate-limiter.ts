import { NextRequest } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory sliding window store
const rateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup stale records every 5 minutes
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((record, key) => {
    record.timestamps = record.timestamps.filter((t: number) => now - t < 300000);
    if (record.timestamps.length === 0) {
      rateLimitMap.delete(key);
    }
  });
}, 300000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  totalLimit: number;
  resetSeconds: number;
}

/**
 * Sliding-window rate limiter per client key (IP or user ID)
 *
 * @param key Unique client identifier (e.g. client IP or user ID)
 * @param maxRequests Maximum allowed requests in the time window
 * @param windowSeconds Time window duration in seconds (default: 60 seconds)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 60,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const cutoff = now - windowMs;

  let record = rateLimitMap.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitMap.set(key, record);
  }

  // Filter timestamps outside current sliding window
  record.timestamps = record.timestamps.filter((t) => t > cutoff);

  if (record.timestamps.length >= maxRequests) {
    const oldestTimestamp = record.timestamps[0];
    const resetSeconds = Math.max(
      1,
      Math.ceil((oldestTimestamp + windowMs - now) / 1000)
    );
    return {
      allowed: false,
      remaining: 0,
      totalLimit: maxRequests,
      resetSeconds,
    };
  }

  record.timestamps.push(now);
  const remaining = Math.max(0, maxRequests - record.timestamps.length);
  return {
    allowed: true,
    remaining,
    totalLimit: maxRequests,
    resetSeconds: windowSeconds,
  };
}

/**
 * Extracts client IP safely from NextRequest headers
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
