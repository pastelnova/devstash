'use server'

import { z } from 'zod'
import { updateEditorPreferences as updateEditorPreferencesQuery } from '@/lib/db/profile'
import type { EditorPreferences } from '@/types/editor-preferences'
import { requireAuth, getFirstZodError } from '@/lib/action-utils'
import type { ActionResult } from '@/actions/types'

const editorPreferencesSchema = z.object({
  fontSize: z.number().int().min(10).max(24),
  tabSize: z.number().int().refine((v) => [2, 4, 8].includes(v), 'Must be 2, 4, or 8'),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(['vs-dark', 'monokai', 'github-dark']),
})

export async function updateEditorPreferences(
  input: EditorPreferences,
): Promise<ActionResult<EditorPreferences>> {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response

  const parsed = editorPreferencesSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: getFirstZodError(parsed) }
  }

  try {
    const data = await updateEditorPreferencesQuery(authResult.session.user.id, parsed.data)
    return { success: true, data }
  } catch {
    return { success: false, error: 'Failed to update editor preferences' }
  }
}
