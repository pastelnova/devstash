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

import { generateAutoTags, generateDescription, explainCode, optimizePrompt } from './ai'

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

describe('generateDescription', () => {
  it('returns error when not authenticated', async () => {
    authMock.mockResolvedValue(null)

    const result = await generateDescription({ title: 'Test', type: 'snippet' })
    expect(result).toEqual({ success: false, error: 'Unauthorized' })
  })

  it('returns error when user is not Pro', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: false } })

    const result = await generateDescription({ title: 'Test', type: 'snippet' })
    expect(result).toEqual({ success: false, error: 'AI features require a Pro plan' })
  })

  it('returns error when title is empty', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })

    const result = await generateDescription({ title: '', type: 'snippet' })
    expect(result.success).toBe(false)
  })

  it('returns error when type is empty', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })

    const result = await generateDescription({ title: 'Test', type: '' })
    expect(result.success).toBe(false)
  })

  it('returns error when rate limited', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    limitMock.mockResolvedValue({ success: false })

    const result = await generateDescription({ title: 'Test', type: 'snippet' })
    expect(result).toEqual({ success: false, error: 'Rate limit exceeded. Please try again later.' })
  })

  it('returns description from {"description": "..."} format', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ description: 'A reusable React hook for authentication.' }),
    })

    const result = await generateDescription({ title: 'useAuth hook', type: 'snippet', content: 'const useAuth = () => {}' })
    expect(result).toEqual({
      success: true,
      data: { description: 'A reusable React hook for authentication.' },
    })
  })

  it('includes all available context in the prompt', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ description: 'Test description' }),
    })

    await generateDescription({
      title: 'Test',
      type: 'snippet',
      content: 'some code',
      url: 'https://example.com',
      tags: ['react', 'hooks'],
      language: 'typescript',
    })

    const callArgs = responsesCreateMock.mock.calls[0][0]
    expect(callArgs.input).toContain('Title: Test')
    expect(callArgs.input).toContain('Type: snippet')
    expect(callArgs.input).toContain('Language: typescript')
    expect(callArgs.input).toContain('some code')
    expect(callArgs.input).toContain('https://example.com')
    expect(callArgs.input).toContain('react, hooks')
  })

  it('truncates content to 2000 chars', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ description: 'Test' }),
    })

    const longContent = 'a'.repeat(5000)
    await generateDescription({ title: 'Test', type: 'snippet', content: longContent })

    const callArgs = responsesCreateMock.mock.calls[0][0]
    expect(callArgs.input).toContain('a'.repeat(2000))
    expect(callArgs.input).not.toContain('a'.repeat(2001))
  })

  it('returns error on unexpected format', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ summary: 'wrong key' }),
    })

    const result = await generateDescription({ title: 'Test', type: 'snippet' })
    expect(result).toEqual({ success: false, error: 'AI returned an unexpected format' })
  })

  it('returns error on invalid JSON response', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockResolvedValue({
      output_text: 'not json',
    })

    const result = await generateDescription({ title: 'Test', type: 'snippet' })
    expect(result).toEqual({ success: false, error: 'AI returned invalid JSON' })
  })

  it('returns generic error on API failure', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockRejectedValue(new Error('API down'))

    const result = await generateDescription({ title: 'Test', type: 'snippet' })
    expect(result).toEqual({ success: false, error: 'Failed to generate description. Please try again.' })
  })

  it('fails open when rate limiter throws', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    limitMock.mockRejectedValue(new Error('Redis down'))
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ description: 'A test item.' }),
    })

    const result = await generateDescription({ title: 'Test', type: 'snippet' })
    expect(result).toEqual({ success: true, data: { description: 'A test item.' } })
  })
})

describe('explainCode', () => {
  it('returns error when not authenticated', async () => {
    authMock.mockResolvedValue(null)

    const result = await explainCode({ code: 'const x = 1', type: 'snippet' })
    expect(result).toEqual({ success: false, error: 'Unauthorized' })
  })

  it('returns error when user is not Pro', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: false } })

    const result = await explainCode({ code: 'const x = 1', type: 'snippet' })
    expect(result).toEqual({ success: false, error: 'AI features require a Pro plan' })
  })

  it('returns error when code is empty', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })

    const result = await explainCode({ code: '', type: 'snippet' })
    expect(result.success).toBe(false)
  })

  it('returns error for invalid type', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })

    const result = await explainCode({ code: 'const x = 1', type: 'note' as 'snippet' })
    expect(result.success).toBe(false)
  })

  it('returns error when rate limited', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    limitMock.mockResolvedValue({ success: false })

    const result = await explainCode({ code: 'const x = 1', type: 'snippet' })
    expect(result).toEqual({ success: false, error: 'Rate limit exceeded. Please try again later.' })
  })

  it('returns explanation on success', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ explanation: '## Overview\nThis declares a constant.' }),
    })

    const result = await explainCode({ code: 'const x = 1', type: 'snippet', language: 'javascript' })
    expect(result).toEqual({
      success: true,
      data: { explanation: '## Overview\nThis declares a constant.' },
    })
  })

  it('includes language and type context in the prompt', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ explanation: 'Explanation here.' }),
    })

    await explainCode({ code: 'ls -la', type: 'command', language: 'bash' })

    const callArgs = responsesCreateMock.mock.calls[0][0]
    expect(callArgs.instructions).toContain('terminal command')
    expect(callArgs.instructions).toContain('bash')
    expect(callArgs.input).toContain('ls -la')
  })

  it('truncates code to 2000 chars', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ explanation: 'Test' }),
    })

    const longCode = 'a'.repeat(5000)
    await explainCode({ code: longCode, type: 'snippet' })

    const callArgs = responsesCreateMock.mock.calls[0][0]
    expect(callArgs.input).toContain('a'.repeat(2000))
    expect(callArgs.input).not.toContain('a'.repeat(2001))
  })

  it('returns error on unexpected format', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ result: 'wrong key' }),
    })

    const result = await explainCode({ code: 'const x = 1', type: 'snippet' })
    expect(result).toEqual({ success: false, error: 'AI returned an unexpected format' })
  })

  it('returns error on invalid JSON response', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockResolvedValue({
      output_text: 'not json',
    })

    const result = await explainCode({ code: 'const x = 1', type: 'snippet' })
    expect(result).toEqual({ success: false, error: 'AI returned invalid JSON' })
  })

  it('returns generic error on API failure', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockRejectedValue(new Error('API down'))

    const result = await explainCode({ code: 'const x = 1', type: 'snippet' })
    expect(result).toEqual({ success: false, error: 'Failed to explain code. Please try again.' })
  })

  it('fails open when rate limiter throws', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    limitMock.mockRejectedValue(new Error('Redis down'))
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ explanation: 'This code does something.' }),
    })

    const result = await explainCode({ code: 'const x = 1', type: 'snippet' })
    expect(result).toEqual({ success: true, data: { explanation: 'This code does something.' } })
  })
})

describe('optimizePrompt', () => {
  it('returns error when not authenticated', async () => {
    authMock.mockResolvedValue(null)

    const result = await optimizePrompt({ content: 'Write a poem' })
    expect(result).toEqual({ success: false, error: 'Unauthorized' })
  })

  it('returns error when user is not Pro', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: false } })

    const result = await optimizePrompt({ content: 'Write a poem' })
    expect(result).toEqual({ success: false, error: 'AI features require a Pro plan' })
  })

  it('returns error when content is empty', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })

    const result = await optimizePrompt({ content: '' })
    expect(result.success).toBe(false)
  })

  it('returns error when rate limited', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    limitMock.mockResolvedValue({ success: false })

    const result = await optimizePrompt({ content: 'Write a poem' })
    expect(result).toEqual({ success: false, error: 'Rate limit exceeded. Please try again later.' })
  })

  it('returns optimized prompt on success', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ optimized: 'Write a creative, evocative poem about nature.' }),
    })

    const result = await optimizePrompt({ content: 'Write a poem' })
    expect(result).toEqual({
      success: true,
      data: { optimized: 'Write a creative, evocative poem about nature.' },
    })
  })

  it('includes prompt content in the API input', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ optimized: 'Optimized version' }),
    })

    await optimizePrompt({ content: 'Summarize this article' })

    const callArgs = responsesCreateMock.mock.calls[0][0]
    expect(callArgs.input).toContain('Summarize this article')
    expect(callArgs.instructions).toContain('prompt engineer')
  })

  it('truncates content to 2000 chars', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ optimized: 'Short result' }),
    })

    const longContent = 'a'.repeat(5000)
    await optimizePrompt({ content: longContent })

    const callArgs = responsesCreateMock.mock.calls[0][0]
    expect(callArgs.input).toContain('a'.repeat(2000))
    expect(callArgs.input).not.toContain('a'.repeat(2001))
  })

  it('returns error on unexpected format', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ result: 'wrong key' }),
    })

    const result = await optimizePrompt({ content: 'Write a poem' })
    expect(result).toEqual({ success: false, error: 'AI returned an unexpected format' })
  })

  it('returns error on invalid JSON response', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockResolvedValue({
      output_text: 'not json',
    })

    const result = await optimizePrompt({ content: 'Write a poem' })
    expect(result).toEqual({ success: false, error: 'AI returned invalid JSON' })
  })

  it('returns generic error on API failure', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    responsesCreateMock.mockRejectedValue(new Error('API down'))

    const result = await optimizePrompt({ content: 'Write a poem' })
    expect(result).toEqual({ success: false, error: 'Failed to optimize prompt. Please try again.' })
  })

  it('fails open when rate limiter throws', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', isPro: true } })
    limitMock.mockRejectedValue(new Error('Redis down'))
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ optimized: 'Better prompt here.' }),
    })

    const result = await optimizePrompt({ content: 'Write a poem' })
    expect(result).toEqual({ success: true, data: { optimized: 'Better prompt here.' } })
  })
})
