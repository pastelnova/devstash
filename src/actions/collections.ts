'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import {
  createCollection as createCollectionQuery,
  type CollectionBasic,
} from '@/lib/db/collections'

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
