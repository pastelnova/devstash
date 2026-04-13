import { describe, it, expect, vi, beforeEach } from 'vitest'

const authMock = vi.fn()
vi.mock('@/auth', () => ({
  auth: () => authMock(),
}))

const createCollectionQueryMock = vi.fn()
const updateCollectionQueryMock = vi.fn()
const deleteCollectionQueryMock = vi.fn()
vi.mock('@/lib/db/collections', () => ({
  createCollection: (...args: unknown[]) => createCollectionQueryMock(...args),
  updateCollection: (...args: unknown[]) => updateCollectionQueryMock(...args),
  deleteCollection: (...args: unknown[]) => deleteCollectionQueryMock(...args),
}))

import { createCollection, updateCollection, deleteCollection } from './collections'

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

describe('updateCollection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns Unauthorized when not authenticated', async () => {
    authMock.mockResolvedValue(null)
    const result = await updateCollection({ id: 'col_1', name: 'New Name' })
    expect(result).toEqual({ success: false, error: 'Unauthorized' })
  })

  it('returns error when name is empty', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    const result = await updateCollection({ id: 'col_1', name: '' })
    expect(result.success).toBe(false)
    expect((result as { error: string }).error).toContain('Name is required')
  })

  it('returns error when collection not found', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    updateCollectionQueryMock.mockResolvedValue(null)

    const result = await updateCollection({ id: 'col_missing', name: 'Test' })
    expect(result).toEqual({ success: false, error: 'Collection not found' })
  })

  it('trims name and updates successfully', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    const updated = { id: 'col_1', name: 'Updated', description: null }
    updateCollectionQueryMock.mockResolvedValue(updated)

    const result = await updateCollection({ id: 'col_1', name: '  Updated  ', description: '' })
    expect(result).toEqual({ success: true, data: updated })
    expect(updateCollectionQueryMock).toHaveBeenCalledWith('u1', 'col_1', {
      name: 'Updated',
      description: null,
    })
  })

  it('returns error when query throws', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    updateCollectionQueryMock.mockRejectedValue(new Error('DB error'))

    const result = await updateCollection({ id: 'col_1', name: 'Test' })
    expect(result).toEqual({ success: false, error: 'Failed to update collection' })
  })
})

describe('deleteCollection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns Unauthorized when not authenticated', async () => {
    authMock.mockResolvedValue(null)
    const result = await deleteCollection('col_1')
    expect(result).toEqual({ success: false, error: 'Unauthorized' })
  })

  it('returns error when collection not found', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    deleteCollectionQueryMock.mockResolvedValue(null)

    const result = await deleteCollection('col_missing')
    expect(result).toEqual({ success: false, error: 'Collection not found' })
  })

  it('deletes collection successfully', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    deleteCollectionQueryMock.mockResolvedValue({ id: 'col_1' })

    const result = await deleteCollection('col_1')
    expect(result).toEqual({ success: true, data: { id: 'col_1' } })
    expect(deleteCollectionQueryMock).toHaveBeenCalledWith('u1', 'col_1')
  })

  it('returns error when query throws', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    deleteCollectionQueryMock.mockRejectedValue(new Error('DB error'))

    const result = await deleteCollection('col_1')
    expect(result).toEqual({ success: false, error: 'Failed to delete collection' })
  })
})
