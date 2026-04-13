'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { updateEditorPreferences as updateEditorPreferencesQuery } from '@/lib/db/profile'
import type { EditorPreferences } from '@/types/editor-preferences'

const editorPreferencesSchema = z.object({
  fontSize: z.number().int().min(10).max(24),
  tabSize: z.number().int().refine((v) => [2, 4, 8].includes(v), 'Must be 2, 4, or 8'),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(['vs-dark', 'monokai', 'github-dark']),
})

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function updateEditorPreferences(
  input: EditorPreferences,
): Promise<ActionResult<EditorPreferences>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const parsed = editorPreferencesSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { success: false, error: first?.message ?? 'Invalid input' }
  }

  try {
    const data = await updateEditorPreferencesQuery(session.user.id, parsed.data)
    return { success: true, data }
  } catch {
    return { success: false, error: 'Failed to update editor preferences' }
  }
}
