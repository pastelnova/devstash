'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  createItem as createItemQuery,
  createFileItem as createFileItemQuery,
  deleteItem as deleteItemQuery,
  updateItem as updateItemQuery,
  toggleItemFavorite as toggleItemFavoriteQuery,
  toggleItemPin as toggleItemPinQuery,
  type ItemDetail,
} from '@/lib/db/items'
import { deleteFromR2 } from '@/lib/r2'
import { canCreateItem } from '@/lib/plan-limits'
import { requireAuth, getFirstZodError, nullableTrimmedString } from '@/lib/action-utils'
import type { ActionResult } from '@/actions/types'

const CREATABLE_TYPES = ['snippet', 'prompt', 'command', 'note', 'link'] as const

const updateItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: nullableTrimmedString.optional().default(null),
  content: nullableTrimmedString.optional().default(null),
  url: z
    .union([z.url('Invalid URL'), z.literal(''), z.null()])
    .transform((v) => (v === '' || v === null ? null : v))
    .optional()
    .default(null),
  language: nullableTrimmedString.optional().default(null),
  tags: z
    .array(z.string().trim().min(1).max(50))
    .max(20)
    .default([])
    .transform((arr) => Array.from(new Set(arr))),
  collectionIds: z.array(z.string().min(1)).default([]),
})

export type UpdateItemInput = z.input<typeof updateItemSchema>

const createItemSchema = z
  .object({
    type: z.enum(CREATABLE_TYPES),
    title: z.string().trim().min(1, 'Title is required'),
    description: nullableTrimmedString.optional().default(null),
    content: nullableTrimmedString.optional().default(null),
    url: z
      .union([z.url('Invalid URL'), z.literal(''), z.null()])
      .transform((v) => (v === '' || v === null ? null : v))
      .optional()
      .default(null),
    language: nullableTrimmedString.optional().default(null),
    tags: z
      .array(z.string().trim().min(1).max(50))
      .max(20)
      .default([])
      .transform((arr) => Array.from(new Set(arr))),
    collectionIds: z.array(z.string().min(1)).default([]),
  })
  .refine((d) => d.type !== 'link' || d.url !== null, {
    message: 'URL is required for links',
    path: ['url'],
  })

export type CreateItemInput = z.input<typeof createItemSchema>

export async function createItem(
  input: CreateItemInput,
): Promise<ActionResult<ItemDetail>> {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response

  const parsed = createItemSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: getFirstZodError(parsed) }
  }

  const allowed = await canCreateItem(authResult.session.user.id, authResult.session.user.isPro ?? false)
  if (!allowed) {
    return { success: false, error: 'Free plan item limit reached. Upgrade to Pro for unlimited items.' }
  }

  const itemType = await prisma.itemType.findFirst({
    where: { isSystem: true, name: parsed.data.type },
    select: { id: true },
  })
  if (!itemType) {
    return { success: false, error: 'Invalid item type' }
  }

  try {
    const created = await createItemQuery(authResult.session.user.id, {
      title: parsed.data.title,
      description: parsed.data.description,
      content: parsed.data.content,
      url: parsed.data.url,
      language: parsed.data.language,
      typeId: itemType.id,
      tags: parsed.data.tags,
      collectionIds: parsed.data.collectionIds,
    })
    return { success: true, data: created }
  } catch {
    return { success: false, error: 'Failed to create item' }
  }
}

const createFileItemSchema = z.object({
  type: z.enum(['file', 'image']),
  title: z.string().trim().min(1, 'Title is required'),
  description: nullableTrimmedString.optional().default(null),
  tags: z
    .array(z.string().trim().min(1).max(50))
    .max(20)
    .default([])
    .transform((arr) => Array.from(new Set(arr))),
  collectionIds: z.array(z.string().min(1)).default([]),
  fileUrl: z.string().min(1, 'File is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().positive(),
})

export type CreateFileItemInput = z.input<typeof createFileItemSchema>

export async function createFileItem(
  input: CreateFileItemInput,
): Promise<ActionResult<ItemDetail>> {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response

  const parsed = createFileItemSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: getFirstZodError(parsed) }
  }

  // File uploads are Pro only; images are allowed for free users
  if (parsed.data.type === 'file' && !(authResult.session.user.isPro ?? false)) {
    return { success: false, error: 'File uploads require a Pro plan. Upgrade to upload files.' }
  }

  const allowed = await canCreateItem(authResult.session.user.id, authResult.session.user.isPro ?? false)
  if (!allowed) {
    return { success: false, error: 'Free plan item limit reached. Upgrade to Pro for unlimited items.' }
  }

  const itemType = await prisma.itemType.findFirst({
    where: { isSystem: true, name: parsed.data.type },
    select: { id: true },
  })
  if (!itemType) {
    return { success: false, error: 'Invalid item type' }
  }

  try {
    const created = await createFileItemQuery(authResult.session.user.id, {
      title: parsed.data.title,
      description: parsed.data.description,
      typeId: itemType.id,
      tags: parsed.data.tags,
      collectionIds: parsed.data.collectionIds,
      fileUrl: parsed.data.fileUrl,
      fileName: parsed.data.fileName,
      fileSize: parsed.data.fileSize,
    })
    return { success: true, data: created }
  } catch {
    return { success: false, error: 'Failed to create item' }
  }
}

export async function updateItem(
  itemId: string,
  input: UpdateItemInput,
): Promise<ActionResult<ItemDetail>> {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response

  const parsed = updateItemSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: getFirstZodError(parsed) }
  }

  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId: authResult.session.user.id },
    select: { id: true },
  })
  if (!existing) {
    return { success: false, error: 'Item not found' }
  }

  try {
    const updated = await updateItemQuery(authResult.session.user.id, itemId, {
      ...parsed.data,
      collectionIds: parsed.data.collectionIds,
    })
    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'Failed to update item' }
  }
}

export async function deleteItem(itemId: string): Promise<ActionResult<{ id: string }>> {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response

  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId: authResult.session.user.id },
    select: { id: true },
  })
  if (!existing) {
    return { success: false, error: 'Item not found' }
  }

  try {
    const fileUrl = await deleteItemQuery(itemId)
    // Clean up R2 file if one existed
    if (fileUrl) {
      await deleteFromR2(fileUrl).catch(() => {
        // Best-effort — item is already deleted from DB
      })
    }
    return { success: true, data: { id: itemId } }
  } catch {
    return { success: false, error: 'Failed to delete item' }
  }
}

export async function toggleItemFavorite(
  itemId: string,
): Promise<ActionResult<{ isFavorite: boolean }>> {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response

  try {
    const result = await toggleItemFavoriteQuery(authResult.session.user.id, itemId)
    if (result === null) {
      return { success: false, error: 'Item not found' }
    }
    return { success: true, data: { isFavorite: result } }
  } catch {
    return { success: false, error: 'Failed to toggle favorite' }
  }
}

export async function toggleItemPin(
  itemId: string,
): Promise<ActionResult<{ isPinned: boolean }>> {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response

  try {
    const result = await toggleItemPinQuery(authResult.session.user.id, itemId)
    if (result === null) {
      return { success: false, error: 'Item not found' }
    }
    return { success: true, data: { isPinned: result } }
  } catch {
    return { success: false, error: 'Failed to toggle pin' }
  }
}
