import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

const redis = getRedis()

// Pre-configured rate limiters per endpoint
export const rateLimiters = {
  login: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        prefix: "rl:login",
        timeout: 3000,
      })
    : null,
  register: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "1 h"),
        prefix: "rl:register",
        timeout: 3000,
      })
    : null,
  forgotPassword: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "1 h"),
        prefix: "rl:forgot-password",
        timeout: 3000,
      })
    : null,
  resetPassword: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        prefix: "rl:reset-password",
        timeout: 3000,
      })
    : null,
  ai: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "1 h"),
        prefix: "rl:ai",
        timeout: 3000,
      })
    : null,
}

export async function getClientIp(): Promise<string> {
  const hdrs = await headers()
  return hdrs.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"
}

export type RateLimitKey = keyof typeof rateLimiters

/**
 * Check rate limit for a given endpoint.
 * Returns null if the request is allowed, or a 429 NextResponse if rate limited.
 * Fails open if Upstash is unavailable.
 */
export async function checkRateLimit(
  key: RateLimitKey,
  identifier: string
): Promise<NextResponse | null> {
  const limiter = rateLimiters[key]
  if (!limiter) return null // fail open

  try {
    const { success, reset } = await limiter.limit(identifier)

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: `Too many attempts. Please try again in ${formatRetryAfter(retryAfter)}.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(retryAfter, 1)) },
        }
      )
    }

    return null
  } catch {
    // Fail open — allow request if Upstash is down
    return null
  }
}

function formatRetryAfter(seconds: number): string {
  if (seconds <= 60) return `${seconds} seconds`
  const minutes = Math.ceil(seconds / 60)
  return `${minutes} minute${minutes === 1 ? "" : "s"}`
}
