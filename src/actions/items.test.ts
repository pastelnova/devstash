import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @/auth
const authMock = vi.fn()
vi.mock('@/auth', () => ({
  auth: () => authMock(),
}))

// Mock prisma
const findFirstMock = vi.fn()
vi.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      findFirst: (...args: unknown[]) => findFirstMock(...args),
    },
  },
}))

// Mock db query
const updateItemQueryMock = vi.fn()
const deleteItemQueryMock = vi.fn()
vi.mock('@/lib/db/items', () => ({
  updateItem: (...args: unknown[]) => updateItemQueryMock(...args),
  deleteItem: (...args: unknown[]) => deleteItemQueryMock(...args),
}))

import { deleteItem, updateItem } from './items'
import type { ItemDetail } from '@/lib/db/items'

const sampleDetail: ItemDetail = {
  id: 'item_1',
  title: 'New title',
  description: null,
  content: null,
  contentType: 'text',
  language: null,
  url: null,
  fileUrl: null,
  fileName: null,
  fileSize: null,
  isFavorite: false,
  isPinned: false,
  type: { id: 'type_1', name: 'snippet', icon: 'Code', color: '#fff' },
  collection: null,
  tags: [],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
}

describe('updateItem server action', () => {
  beforeEach(() => {
    authMock.mockReset()
    findFirstMock.mockReset()
    updateItemQueryMock.mockReset()
  })

  it('returns Unauthorized when no session', async () => {
    authMock.mockResolvedValue(null)
    const result = await updateItem('item_1', {
      title: 'Hello',
      tags: [],
    })
    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(findFirstMock).not.toHaveBeenCalled()
  })

  it('rejects empty title via Zod', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    const result = await updateItem('item_1', {
      title: '   ',
      tags: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/title/i)
    expect(findFirstMock).not.toHaveBeenCalled()
  })

  it('rejects invalid URL via Zod', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    const result = await updateItem('item_1', {
      title: 'OK',
      url: 'not-a-url',
      tags: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/url/i)
  })

  it('returns Item not found when ownership check fails', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    findFirstMock.mockResolvedValue(null)
    const result = await updateItem('item_1', {
      title: 'OK',
      tags: [],
    })
    expect(result).toEqual({ success: false, error: 'Item not found' })
    expect(updateItemQueryMock).not.toHaveBeenCalled()
  })

  it('calls query with trimmed/normalized data on success', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    findFirstMock.mockResolvedValue({ id: 'item_1' })
    updateItemQueryMock.mockResolvedValue(sampleDetail)

    const result = await updateItem('item_1', {
      title: '  New title  ',
      description: '',
      content: 'console.log(1)',
      url: '',
      language: 'typescript',
      tags: ['react', 'react', ' hooks '],
    })

    expect(result).toEqual({ success: true, data: sampleDetail })
    expect(updateItemQueryMock).toHaveBeenCalledTimes(1)
    const [userId, itemId, data] = updateItemQueryMock.mock.calls[0]
    expect(userId).toBe('user_1')
    expect(itemId).toBe('item_1')
    expect(data).toMatchObject({
      title: 'New title',
      description: null,
      content: 'console.log(1)',
      url: null,
      language: 'typescript',
    })
    // Dedupes and trims tags
    expect(data.tags).toEqual(['react', 'hooks'])
  })

  it('returns generic error when query throws', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    findFirstMock.mockResolvedValue({ id: 'item_1' })
    updateItemQueryMock.mockRejectedValue(new Error('db down'))

    const result = await updateItem('item_1', {
      title: 'OK',
      tags: [],
    })
    expect(result).toEqual({ success: false, error: 'Failed to update item' })
  })
})

describe('deleteItem server action', () => {
  beforeEach(() => {
    authMock.mockReset()
    findFirstMock.mockReset()
    deleteItemQueryMock.mockReset()
  })

  it('returns Unauthorized when no session', async () => {
    authMock.mockResolvedValue(null)
    const result = await deleteItem('item_1')
    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(findFirstMock).not.toHaveBeenCalled()
    expect(deleteItemQueryMock).not.toHaveBeenCalled()
  })

  it('returns Item not found when ownership check fails', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    findFirstMock.mockResolvedValue(null)
    const result = await deleteItem('item_1')
    expect(result).toEqual({ success: false, error: 'Item not found' })
    expect(deleteItemQueryMock).not.toHaveBeenCalled()
  })

  it('deletes the item on the happy path', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    findFirstMock.mockResolvedValue({ id: 'item_1' })
    deleteItemQueryMock.mockResolvedValue(undefined)

    const result = await deleteItem('item_1')

    expect(result).toEqual({ success: true, data: { id: 'item_1' } })
    expect(findFirstMock).toHaveBeenCalledTimes(1)
    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: 'item_1', userId: 'user_1' },
      select: { id: true },
    })
    expect(deleteItemQueryMock).toHaveBeenCalledWith('item_1')
  })

  it('returns generic error when query throws', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    findFirstMock.mockResolvedValue({ id: 'item_1' })
    deleteItemQueryMock.mockRejectedValue(new Error('db down'))

    const result = await deleteItem('item_1')
    expect(result).toEqual({ success: false, error: 'Failed to delete item' })
  })
})
