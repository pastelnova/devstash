import { describe, it, expect, vi, beforeEach } from 'vitest'

const authMock = vi.fn()
vi.mock('@/auth', () => ({
  auth: () => authMock(),
}))

const createCollectionQueryMock = vi.fn()
vi.mock('@/lib/db/collections', () => ({
  createCollection: (...args: unknown[]) => createCollectionQueryMock(...args),
}))

import { createCollection } from './collections'

const sampleCollection = {
  id: 'col_1',
  name: 'React Patterns',
  description: 'Useful React patterns',
}

describe('createCollection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns Unauthorized when not authenticated', async () => {
    authMock.mockResolvedValue(null)
    const result = await createCollection({ name: 'Test' })
    expect(result).toEqual({ success: false, error: 'Unauthorized' })
  })

  it('returns error when name is empty', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    const result = await createCollection({ name: '' })
    expect(result.success).toBe(false)
    expect((result as { error: string }).error).toContain('Name is required')
  })

  it('returns error when name exceeds 100 characters', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    const result = await createCollection({ name: 'a'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('trims name and converts empty description to null', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    createCollectionQueryMock.mockResolvedValue(sampleCollection)

    const result = await createCollection({ name: '  React Patterns  ', description: '' })
    expect(result).toEqual({ success: true, data: sampleCollection })
    expect(createCollectionQueryMock).toHaveBeenCalledWith('u1', {
      name: 'React Patterns',
      description: null,
    })
  })

  it('creates collection with description', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    createCollectionQueryMock.mockResolvedValue(sampleCollection)

    const result = await createCollection({ name: 'React Patterns', description: 'Useful patterns' })
    expect(result).toEqual({ success: true, data: sampleCollection })
    expect(createCollectionQueryMock).toHaveBeenCalledWith('u1', {
      name: 'React Patterns',
      description: 'Useful patterns',
    })
  })

  it('returns error when query throws', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    createCollectionQueryMock.mockRejectedValue(new Error('DB error'))

    const result = await createCollection({ name: 'Test' })
    expect(result).toEqual({ success: false, error: 'Failed to create collection' })
  })
})
