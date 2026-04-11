'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  createItem as createItemQuery,
  createFileItem as createFileItemQuery,
  deleteItem as deleteItemQuery,
  updateItem as updateItemQuery,
  type ItemDetail,
} from '@/lib/db/items'
import { deleteFromR2 } from '@/lib/r2'

const CREATABLE_TYPES = ['snippet', 'prompt', 'command', 'note', 'link'] as const

const nullableTrimmedString = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()

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

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function createItem(
  input: CreateItemInput,
): Promise<ActionResult<ItemDetail>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const parsed = createItemSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { success: false, error: first?.message ?? 'Invalid input' }
  }

  const itemType = await prisma.itemType.findFirst({
    where: { isSystem: true, name: parsed.data.type },
    select: { id: true },
  })
  if (!itemType) {
    return { success: false, error: 'Invalid item type' }
  }

  try {
    const created = await createItemQuery(session.user.id, {
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
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const parsed = createFileItemSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { success: false, error: first?.message ?? 'Invalid input' }
  }

  const itemType = await prisma.itemType.findFirst({
    where: { isSystem: true, name: parsed.data.type },
    select: { id: true },
  })
  if (!itemType) {
    return { success: false, error: 'Invalid item type' }
  }

  try {
    const created = await createFileItemQuery(session.user.id, {
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
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const parsed = updateItemSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { success: false, error: first?.message ?? 'Invalid input' }
  }

  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId: session.user.id },
    select: { id: true },
  })
  if (!existing) {
    return { success: false, error: 'Item not found' }
  }

  try {
    const updated = await updateItemQuery(session.user.id, itemId, {
      ...parsed.data,
      collectionIds: parsed.data.collectionIds,
    })
    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'Failed to update item' }
  }
}

export async function deleteItem(itemId: string): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId: session.user.id },
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
