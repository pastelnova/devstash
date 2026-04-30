import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimiters: {
    ai: null,
  },
}))

import { auth } from '@/auth'
import { rateLimiters } from '@/lib/rate-limit'
import { requireAuth, getFirstZodError, extractAiStringField, checkAiRateLimit } from './action-utils'
import { z } from 'zod'

const mockAuth = auth as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('requireAuth', () => {
  it('returns ok: false when no session', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await requireAuth()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response).toEqual({ success: false, error: 'Unauthorized' })
    }
  })

  it('returns ok: true with session when authenticated', async () => {
    const session = { user: { id: 'u1', isPro: false } }
    mockAuth.mockResolvedValue(session)
    const result = await requireAuth()
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.session).toBe(session)
    }
  })
})

describe('getFirstZodError', () => {
  it('returns first issue message', () => {
    const schema = z.object({ name: z.string().min(1, 'Name is required') })
    const parsed = schema.safeParse({ name: '' })
    if (!parsed.success) {
      expect(getFirstZodError(parsed)).toBe('Name is required')
    }
  })

  it('falls back to Invalid input when no message', () => {
    const fakeResult = { error: { issues: [] } } as unknown as { error: z.ZodError }
    expect(getFirstZodError(fakeResult)).toBe('Invalid input')
  })
})

describe('extractAiStringField', () => {
  it('extracts a string field from JSON', () => {
    const json = JSON.stringify({ description: '  A test  ' })
    expect(extractAiStringField(json, 'description')).toBe('A test')
  })

  it('returns null for missing field', () => {
    const json = JSON.stringify({ other: 'value' })
    expect(extractAiStringField(json, 'description')).toBeNull()
  })

  it('returns null for non-string field', () => {
    const json = JSON.stringify({ description: 123 })
    expect(extractAiStringField(json, 'description')).toBeNull()
  })

  it('returns null for empty trimmed string', () => {
    const json = JSON.stringify({ description: '   ' })
    expect(extractAiStringField(json, 'description')).toBeNull()
  })

  it('throws SyntaxError for invalid JSON', () => {
    expect(() => extractAiStringField('not json', 'field')).toThrow(SyntaxError)
  })
})

describe('checkAiRateLimit', () => {
  it('returns null when no limiter configured', async () => {
    (rateLimiters as Record<string, unknown>).ai = null
    const result = await checkAiRateLimit('u1')
    expect(result).toBeNull()
  })

  it('returns error string when rate limited', async () => {
    (rateLimiters as Record<string, unknown>).ai = {
      limit: vi.fn().mockResolvedValue({ success: false }),
    }
    const result = await checkAiRateLimit('u1')
    expect(result).toBe('Rate limit exceeded. Please try again later.')
  })

  it('returns null when rate limit passes', async () => {
    (rateLimiters as Record<string, unknown>).ai = {
      limit: vi.fn().mockResolvedValue({ success: true }),
    }
    const result = await checkAiRateLimit('u1')
    expect(result).toBeNull()
  })

  it('fails open when limiter throws', async () => {
    (rateLimiters as Record<string, unknown>).ai = {
      limit: vi.fn().mockRejectedValue(new Error('Redis down')),
    }
    const result = await checkAiRateLimit('u1')
    expect(result).toBeNull()
  })
})
