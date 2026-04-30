import { z } from 'zod'
import { auth } from '@/auth'
import { rateLimiters } from '@/lib/rate-limit'

/**
 * Checks auth session and returns a discriminated union.
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false as const, response: { success: false as const, error: 'Unauthorized' } }
  }
  return { ok: true as const, session }
}

/**
 * Extracts the first Zod error message from a failed SafeParseReturnType.
 */
export function getFirstZodError(result: { error: z.ZodError }): string {
  return result.error.issues[0]?.message ?? 'Invalid input'
}

/**
 * Reusable Zod schema for nullable trimmed strings.
 * Trims whitespace and converts empty strings to null.
 */
export const nullableTrimmedString = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()

/**
 * Checks AI rate limit for a user. Returns error string or null.
 * Fails open if Upstash is down.
 */
export async function checkAiRateLimit(userId: string): Promise<string | null> {
  const limiter = rateLimiters.ai
  if (limiter) {
    try {
      const { success } = await limiter.limit(userId)
      if (!success) {
        return 'Rate limit exceeded. Please try again later.'
      }
    } catch {
      // Fail open if Upstash is down
    }
  }
  return null
}

/**
 * Parses AI JSON response and extracts a string field.
 * Returns the trimmed string value or null if the field is missing/wrong type.
 */
export function extractAiStringField(jsonText: string, field: string): string | null {
  const parsed = JSON.parse(jsonText)
  if (typeof parsed === 'object' && parsed !== null && typeof parsed[field] === 'string') {
    const value = parsed[field].trim()
    return value.length > 0 ? value : null
  }
  return null
}
