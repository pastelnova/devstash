'use server'

import { z } from 'zod'
import {
  createCollection as createCollectionQuery,
  updateCollection as updateCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  toggleCollectionFavorite as toggleCollectionFavoriteQuery,
  type CollectionBasic,
} from '@/lib/db/collections'
import { canCreateCollection } from '@/lib/plan-limits'
import { requireAuth, getFirstZodError, nullableTrimmedString } from '@/lib/action-utils'
import type { ActionResult } from '@/actions/types'

const createCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  description: nullableTrimmedString.optional().default(null),
})

export type CreateCollectionInput = z.input<typeof createCollectionSchema>

export async function createCollection(
  input: CreateCollectionInput,
): Promise<ActionResult<CollectionBasic>> {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response

  const parsed = createCollectionSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: getFirstZodError(parsed) }
  }

  const allowed = await canCreateCollection(authResult.session.user.id, authResult.session.user.isPro ?? false)
  if (!allowed) {
    return { success: false, error: 'Free plan collection limit reached. Upgrade to Pro for unlimited collections.' }
  }

  try {
    const created = await createCollectionQuery(authResult.session.user.id, {
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
  description: nullableTrimmedString.optional().default(null),
})

export type UpdateCollectionInput = z.input<typeof updateCollectionSchema>

export async function updateCollection(
  input: UpdateCollectionInput,
): Promise<ActionResult<CollectionBasic>> {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response

  const parsed = updateCollectionSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: getFirstZodError(parsed) }
  }

  try {
    const updated = await updateCollectionQuery(authResult.session.user.id, parsed.data.id, {
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
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response

  try {
    const result = await deleteCollectionQuery(authResult.session.user.id, id)
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
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response

  try {
    const result = await toggleCollectionFavoriteQuery(authResult.session.user.id, collectionId)
    if (result === null) {
      return { success: false, error: 'Collection not found' }
    }
    return { success: true, data: { isFavorite: result } }
  } catch {
    return { success: false, error: 'Failed to toggle favorite' }
  }
}
