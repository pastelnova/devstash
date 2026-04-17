'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import {
  createCollection as createCollectionQuery,
  updateCollection as updateCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  toggleCollectionFavorite as toggleCollectionFavoriteQuery,
  type CollectionBasic,
} from '@/lib/db/collections'
import { canCreateCollection } from '@/lib/plan-limits'

const createCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  description: z
    .string()
    .trim()
    .transform((v) => (v.length === 0 ? null : v))
    .nullable()
    .optional()
    .default(null),
})

export type CreateCollectionInput = z.input<typeof createCollectionSchema>

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function createCollection(
  input: CreateCollectionInput,
): Promise<ActionResult<CollectionBasic>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const parsed = createCollectionSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { success: false, error: first?.message ?? 'Invalid input' }
  }

  const allowed = await canCreateCollection(session.user.id, session.user.isPro ?? false)
  if (!allowed) {
    return { success: false, error: 'Free plan collection limit reached. Upgrade to Pro for unlimited collections.' }
  }

  try {
    const created = await createCollectionQuery(session.user.id, {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    })
    return { success: true, data: created }
  } catch {
    return { success: false, error: 'Failed to create collection' }
  }
}

const updateCollectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'Name is required').max(100),
  description: z
    .string()
    .trim()
    .transform((v) => (v.length === 0 ? null : v))
    .nullable()
    .optional()
    .default(null),
})

export type UpdateCollectionInput = z.input<typeof updateCollectionSchema>

export async function updateCollection(
  input: UpdateCollectionInput,
): Promise<ActionResult<CollectionBasic>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const parsed = updateCollectionSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { success: false, error: first?.message ?? 'Invalid input' }
  }

  try {
    const updated = await updateCollectionQuery(session.user.id, parsed.data.id, {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    })
    if (!updated) {
      return { success: false, error: 'Collection not found' }
    }
    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'Failed to update collection' }
  }
}

export async function deleteCollection(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const result = await deleteCollectionQuery(session.user.id, id)
    if (!result) {
      return { success: false, error: 'Collection not found' }
    }
    return { success: true, data: result }
  } catch {
    return { success: false, error: 'Failed to delete collection' }
  }
}

export async function toggleCollectionFavorite(
  collectionId: string,
): Promise<ActionResult<{ isFavorite: boolean }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const result = await toggleCollectionFavoriteQuery(session.user.id, collectionId)
    if (result === null) {
      return { success: false, error: 'Collection not found' }
    }
    return { success: true, data: { isFavorite: result } }
  } catch {
    return { success: false, error: 'Failed to toggle favorite' }
  }
}
