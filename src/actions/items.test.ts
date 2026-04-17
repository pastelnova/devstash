import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @/auth
const authMock = vi.fn()
vi.mock('@/auth', () => ({
  auth: () => authMock(),
}))

// Mock prisma
const findFirstMock = vi.fn()
const itemTypeFindFirstMock = vi.fn()
vi.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      findFirst: (...args: unknown[]) => findFirstMock(...args),
    },
    itemType: {
      findFirst: (...args: unknown[]) => itemTypeFindFirstMock(...args),
    },
  },
}))

// Mock db query
const updateItemQueryMock = vi.fn()
const deleteItemQueryMock = vi.fn()
const createItemQueryMock = vi.fn()
const createFileItemQueryMock = vi.fn()
const toggleItemFavoriteQueryMock = vi.fn()
const toggleItemPinQueryMock = vi.fn()
vi.mock('@/lib/db/items', () => ({
  updateItem: (...args: unknown[]) => updateItemQueryMock(...args),
  deleteItem: (...args: unknown[]) => deleteItemQueryMock(...args),
  createItem: (...args: unknown[]) => createItemQueryMock(...args),
  createFileItem: (...args: unknown[]) => createFileItemQueryMock(...args),
  toggleItemFavorite: (...args: unknown[]) => toggleItemFavoriteQueryMock(...args),
  toggleItemPin: (...args: unknown[]) => toggleItemPinQueryMock(...args),
}))

// Mock R2
const deleteFromR2Mock = vi.fn()
vi.mock('@/lib/r2', () => ({
  deleteFromR2: (...args: unknown[]) => deleteFromR2Mock(...args),
}))

// Mock plan limits
const canCreateItemMock = vi.fn()
vi.mock('@/lib/plan-limits', () => ({
  canCreateItem: (...args: unknown[]) => canCreateItemMock(...args),
}))

import { createItem, createFileItem, deleteItem, updateItem, toggleItemFavorite, toggleItemPin } from './items'
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
  collections: [],
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
      collectionIds: ['col_1', 'col_2'],
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
    // Passes collection IDs through
    expect(data.collectionIds).toEqual(['col_1', 'col_2'])
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

describe('createItem server action', () => {
  beforeEach(() => {
    authMock.mockReset()
    itemTypeFindFirstMock.mockReset()
    createItemQueryMock.mockReset()
    canCreateItemMock.mockReset()
    canCreateItemMock.mockResolvedValue(true)
  })

  it('returns Unauthorized when no session', async () => {
    authMock.mockResolvedValue(null)
    const result = await createItem({
      type: 'snippet',
      title: 'Hello',
      tags: [],
    })
    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(itemTypeFindFirstMock).not.toHaveBeenCalled()
    expect(createItemQueryMock).not.toHaveBeenCalled()
  })

  it('rejects empty title via Zod', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    const result = await createItem({
      type: 'snippet',
      title: '   ',
      tags: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/title/i)
    expect(itemTypeFindFirstMock).not.toHaveBeenCalled()
  })

  it('requires URL for link type', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    const result = await createItem({
      type: 'link',
      title: 'Cool link',
      tags: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/url/i)
    expect(itemTypeFindFirstMock).not.toHaveBeenCalled()
  })

  it('rejects invalid URL via Zod', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    const result = await createItem({
      type: 'link',
      title: 'Cool link',
      url: 'not-a-url',
      tags: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/url/i)
  })

  it('rejects when free plan item limit is reached', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1', isPro: false } })
    canCreateItemMock.mockResolvedValue(false)
    const result = await createItem({
      type: 'snippet',
      title: 'Hello',
      tags: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/item limit/i)
    expect(itemTypeFindFirstMock).not.toHaveBeenCalled()
  })

  it('returns error when system item type not found', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    itemTypeFindFirstMock.mockResolvedValue(null)
    const result = await createItem({
      type: 'snippet',
      title: 'Hello',
      tags: [],
    })
    expect(result).toEqual({ success: false, error: 'Invalid item type' })
    expect(createItemQueryMock).not.toHaveBeenCalled()
  })

  it('calls query with trimmed/normalized data on success', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    itemTypeFindFirstMock.mockResolvedValue({ id: 'type_1' })
    createItemQueryMock.mockResolvedValue(sampleDetail)

    const result = await createItem({
      type: 'snippet',
      title: '  New title  ',
      description: '',
      content: 'console.log(1)',
      language: 'typescript',
      tags: ['react', 'react', ' hooks '],
      collectionIds: ['col_1'],
    })

    expect(result).toEqual({ success: true, data: sampleDetail })
    expect(createItemQueryMock).toHaveBeenCalledTimes(1)
    const [userId, data] = createItemQueryMock.mock.calls[0]
    expect(userId).toBe('user_1')
    expect(data).toMatchObject({
      title: 'New title',
      description: null,
      content: 'console.log(1)',
      url: null,
      language: 'typescript',
      typeId: 'type_1',
    })
    expect(data.tags).toEqual(['react', 'hooks'])
    expect(data.collectionIds).toEqual(['col_1'])
  })

  it('returns generic error when query throws', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    itemTypeFindFirstMock.mockResolvedValue({ id: 'type_1' })
    createItemQueryMock.mockRejectedValue(new Error('db down'))

    const result = await createItem({
      type: 'note',
      title: 'A note',
      tags: [],
    })
    expect(result).toEqual({ success: false, error: 'Failed to create item' })
  })
})

describe('createFileItem server action', () => {
  beforeEach(() => {
    authMock.mockReset()
    itemTypeFindFirstMock.mockReset()
    createFileItemQueryMock.mockReset()
    canCreateItemMock.mockReset()
    canCreateItemMock.mockResolvedValue(true)
  })

  it('returns Unauthorized when no session', async () => {
    authMock.mockResolvedValue(null)
    const result = await createFileItem({
      type: 'image',
      title: 'Photo',
      fileUrl: 'user_1/images/abc.png',
      fileName: 'photo.png',
      fileSize: 1024,
      tags: [],
    })
    expect(result).toEqual({ success: false, error: 'Unauthorized' })
  })

  it('rejects empty title via Zod', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    const result = await createFileItem({
      type: 'file',
      title: '   ',
      fileUrl: 'key',
      fileName: 'doc.pdf',
      fileSize: 500,
      tags: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/title/i)
  })

  it('rejects missing fileUrl', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    const result = await createFileItem({
      type: 'file',
      title: 'Doc',
      fileUrl: '',
      fileName: 'doc.pdf',
      fileSize: 500,
      tags: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects file upload for free users', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1', isPro: false } })
    const result = await createFileItem({
      type: 'file',
      title: 'Doc',
      fileUrl: 'key',
      fileName: 'doc.pdf',
      fileSize: 500,
      tags: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/pro plan/i)
    expect(canCreateItemMock).not.toHaveBeenCalled()
  })

  it('allows image upload for free users', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1', isPro: false } })
    itemTypeFindFirstMock.mockResolvedValue({ id: 'type_image' })
    createFileItemQueryMock.mockResolvedValue({ ...sampleDetail, contentType: 'file' })
    const result = await createFileItem({
      type: 'image',
      title: 'Photo',
      fileUrl: 'key',
      fileName: 'photo.png',
      fileSize: 1024,
      tags: [],
    })
    expect(result.success).toBe(true)
  })

  it('rejects when free plan item limit is reached', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1', isPro: false } })
    canCreateItemMock.mockResolvedValue(false)
    const result = await createFileItem({
      type: 'image',
      title: 'Photo',
      fileUrl: 'key',
      fileName: 'photo.png',
      fileSize: 1024,
      tags: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/item limit/i)
  })

  it('returns error when system item type not found', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    itemTypeFindFirstMock.mockResolvedValue(null)
    const result = await createFileItem({
      type: 'image',
      title: 'Photo',
      fileUrl: 'key',
      fileName: 'photo.png',
      fileSize: 1024,
      tags: [],
    })
    expect(result).toEqual({ success: false, error: 'Invalid item type' })
  })

  it('calls query with correct data on success', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    itemTypeFindFirstMock.mockResolvedValue({ id: 'type_image' })
    createFileItemQueryMock.mockResolvedValue({ ...sampleDetail, contentType: 'file' })

    const result = await createFileItem({
      type: 'image',
      title: '  My Photo  ',
      description: 'A nice photo',
      fileUrl: 'user_1/images/abc.png',
      fileName: 'photo.png',
      fileSize: 2048,
      tags: ['design', 'design', ' ui '],
      collectionIds: ['col_1'],
    })

    expect(result.success).toBe(true)
    expect(createFileItemQueryMock).toHaveBeenCalledTimes(1)
    const [userId, data] = createFileItemQueryMock.mock.calls[0]
    expect(userId).toBe('user_1')
    expect(data).toMatchObject({
      title: 'My Photo',
      fileUrl: 'user_1/images/abc.png',
      fileName: 'photo.png',
      fileSize: 2048,
      typeId: 'type_image',
    })
    expect(data.tags).toEqual(['design', 'ui'])
    expect(data.collectionIds).toEqual(['col_1'])
  })

  it('returns generic error when query throws', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1', isPro: true } })
    itemTypeFindFirstMock.mockResolvedValue({ id: 'type_file' })
    createFileItemQueryMock.mockRejectedValue(new Error('db down'))

    const result = await createFileItem({
      type: 'file',
      title: 'Doc',
      fileUrl: 'key',
      fileName: 'doc.pdf',
      fileSize: 500,
      tags: [],
    })
    expect(result).toEqual({ success: false, error: 'Failed to create item' })
  })
})

describe('deleteItem server action', () => {
  beforeEach(() => {
    authMock.mockReset()
    findFirstMock.mockReset()
    deleteItemQueryMock.mockReset()
    deleteFromR2Mock.mockReset()
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

  it('deletes the item on the happy path (no file)', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    findFirstMock.mockResolvedValue({ id: 'item_1' })
    deleteItemQueryMock.mockResolvedValue(null)

    const result = await deleteItem('item_1')

    expect(result).toEqual({ success: true, data: { id: 'item_1' } })
    expect(deleteItemQueryMock).toHaveBeenCalledWith('item_1')
    expect(deleteFromR2Mock).not.toHaveBeenCalled()
  })

  it('deletes R2 file when item has fileUrl', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    findFirstMock.mockResolvedValue({ id: 'item_1' })
    deleteItemQueryMock.mockResolvedValue('user_1/images/abc.png')
    deleteFromR2Mock.mockResolvedValue(undefined)

    const result = await deleteItem('item_1')

    expect(result).toEqual({ success: true, data: { id: 'item_1' } })
    expect(deleteFromR2Mock).toHaveBeenCalledWith('user_1/images/abc.png')
  })

  it('succeeds even if R2 delete fails (best-effort)', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    findFirstMock.mockResolvedValue({ id: 'item_1' })
    deleteItemQueryMock.mockResolvedValue('user_1/files/doc.pdf')
    deleteFromR2Mock.mockRejectedValue(new Error('R2 down'))

    const result = await deleteItem('item_1')

    expect(result).toEqual({ success: true, data: { id: 'item_1' } })
  })

  it('returns generic error when query throws', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    findFirstMock.mockResolvedValue({ id: 'item_1' })
    deleteItemQueryMock.mockRejectedValue(new Error('db down'))

    const result = await deleteItem('item_1')
    expect(result).toEqual({ success: false, error: 'Failed to delete item' })
  })
})

describe('toggleItemFavorite server action', () => {
  beforeEach(() => {
    authMock.mockReset()
    toggleItemFavoriteQueryMock.mockReset()
  })

  it('returns Unauthorized when no session', async () => {
    authMock.mockResolvedValue(null)
    const result = await toggleItemFavorite('item_1')
    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(toggleItemFavoriteQueryMock).not.toHaveBeenCalled()
  })

  it('returns Item not found when query returns null', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    toggleItemFavoriteQueryMock.mockResolvedValue(null)
    const result = await toggleItemFavorite('item_1')
    expect(result).toEqual({ success: false, error: 'Item not found' })
  })

  it('returns new isFavorite value on success', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    toggleItemFavoriteQueryMock.mockResolvedValue(true)
    const result = await toggleItemFavorite('item_1')
    expect(result).toEqual({ success: true, data: { isFavorite: true } })
    expect(toggleItemFavoriteQueryMock).toHaveBeenCalledWith('user_1', 'item_1')
  })

  it('returns generic error when query throws', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    toggleItemFavoriteQueryMock.mockRejectedValue(new Error('db down'))
    const result = await toggleItemFavorite('item_1')
    expect(result).toEqual({ success: false, error: 'Failed to toggle favorite' })
  })
})

describe('toggleItemPin server action', () => {
  beforeEach(() => {
    authMock.mockReset()
    toggleItemPinQueryMock.mockReset()
  })

  it('returns Unauthorized when no session', async () => {
    authMock.mockResolvedValue(null)
    const result = await toggleItemPin('item_1')
    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(toggleItemPinQueryMock).not.toHaveBeenCalled()
  })

  it('returns Item not found when query returns null', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    toggleItemPinQueryMock.mockResolvedValue(null)
    const result = await toggleItemPin('item_1')
    expect(result).toEqual({ success: false, error: 'Item not found' })
  })

  it('returns new isPinned value on success', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    toggleItemPinQueryMock.mockResolvedValue(true)
    const result = await toggleItemPin('item_1')
    expect(result).toEqual({ success: true, data: { isPinned: true } })
    expect(toggleItemPinQueryMock).toHaveBeenCalledWith('user_1', 'item_1')
  })

  it('returns generic error when query throws', async () => {
    authMock.mockResolvedValue({ user: { id: 'user_1' } })
    toggleItemPinQueryMock.mockRejectedValue(new Error('db down'))
    const result = await toggleItemPin('item_1')
    expect(result).toEqual({ success: false, error: 'Failed to toggle pin' })
  })
})
