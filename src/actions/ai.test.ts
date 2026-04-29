import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @/auth
const authMock = vi.fn()
vi.mock('@/auth', () => ({
  auth: () => authMock(),
}))

// Mock OpenAI
const responsesCreateMock = vi.fn()
vi.mock('@/lib/openai', () => ({
  getOpenAIClient: () => ({
    responses: {
      create: (...args: unknown[]) => responsesCreateMock(...args),
    },
  }),
  AI_MODEL: 'gpt-5-nano',
}))

// Mock rate limiter
const limitMock = vi.fn()
vi.mock('@/lib/rate-limit', () => ({
  rateLimiters: {
    ai: { limit: (...args: unknown[]) => limitMock(...args) },
  },
}))

import { generateAutoTags } from './ai'

beforeEach(() => {
  vi.clearAllMocks()
  limitMock.mockResolvedValue({ success: true })
})

describe('generateAutoTags', () => {
  it('returns error when not authenticated', async () => {
    authMock.mockResolvedValue(null)

    const result = await generateAutoTags({ title: 'Test' })
    expect(result).toEqual({ success: false, error: 'Unauthorized' })
  })

  it('returns error when user is not Pro', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: false } })

    const result = await generateAutoTags({ title: 'Test' })
    expect(result).toEqual({ success: false, error: 'AI features require a Pro plan' })
  })

  it('returns error when title is empty', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })

    const result = await generateAutoTags({ title: '' })
    expect(result.success).toBe(false)
  })

  it('returns error when rate limited', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    limitMock.mockResolvedValue({ success: false })

    const result = await generateAutoTags({ title: 'Test' })
    expect(result).toEqual({ success: false, error: 'Rate limit exceeded. Please try again later.' })
  })

  it('returns tags from {"tags": [...]} format', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ tags: ['React', 'Hooks', 'TypeScript'] }),
    })

    const result = await generateAutoTags({ title: 'React hook snippet', content: 'const useAuth = () => {}' })
    expect(result).toEqual({
      success: true,
      data: { tags: ['react', 'hooks', 'typescript'] },
    })
  })

  it('returns tags from [...] format', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify(['API', 'REST', 'fetch']),
    })

    const result = await generateAutoTags({ title: 'Fetch helper' })
    expect(result).toEqual({
      success: true,
      data: { tags: ['api', 'rest', 'fetch'] },
    })
  })

  it('truncates content to 2000 chars', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ tags: ['test'] }),
    })

    const longContent = 'a'.repeat(5000)
    await generateAutoTags({ title: 'Test', content: longContent })

    const callArgs = responsesCreateMock.mock.calls[0][0]
    // The input should contain truncated content (2000 chars, not 5000)
    expect(callArgs.input).toContain('a'.repeat(2000))
    expect(callArgs.input).not.toContain('a'.repeat(2001))
  })

  it('includes existing tags hint when provided', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ tags: ['new-tag'] }),
    })

    await generateAutoTags({ title: 'Test', existingTags: ['react', 'hooks'] })

    const callArgs = responsesCreateMock.mock.calls[0][0]
    expect(callArgs.input).toContain('react, hooks')
    expect(callArgs.input).toContain('Suggest different tags')
  })

  it('returns error on invalid JSON response', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockResolvedValue({
      output_text: 'not json',
    })

    const result = await generateAutoTags({ title: 'Test' })
    expect(result).toEqual({ success: false, error: 'AI returned invalid JSON' })
  })

  it('returns error on unexpected format', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ result: 'no tags key' }),
    })

    const result = await generateAutoTags({ title: 'Test' })
    expect(result).toEqual({ success: false, error: 'AI returned an unexpected format' })
  })

  it('returns generic error on API failure', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockRejectedValue(new Error('API down'))

    const result = await generateAutoTags({ title: 'Test' })
    expect(result).toEqual({ success: false, error: 'Failed to generate tags. Please try again.' })
  })

  it('fails open when rate limiter throws', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    limitMock.mockRejectedValue(new Error('Redis down'))
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ tags: ['test'] }),
    })

    const result = await generateAutoTags({ title: 'Test' })
    expect(result).toEqual({ success: true, data: { tags: ['test'] } })
  })
})
