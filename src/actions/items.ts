'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  updateItem as updateItemQuery,
  type ItemDetail,
} from '@/lib/db/items'

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
    .array(z.string().trim().min(1))
    .default([])
    .transform((arr) => Array.from(new Set(arr))),
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
      .array(z.string().trim().min(1))
      .default([])
      .transform((arr) => Array.from(new Set(arr))),
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
    const updated = await updateItemQuery(session.user.id, itemId, parsed.data)
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
    await deleteItemQuery(itemId)
    return { success: true, data: { id: itemId } }
  } catch {
    return { success: false, error: 'Failed to delete item' }
  }
}
