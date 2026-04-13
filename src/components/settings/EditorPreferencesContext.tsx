'use client'

import { createContext, useContext, useState } from 'react'
import { type EditorPreferences, EDITOR_DEFAULTS } from '@/types/editor-preferences'

interface EditorPreferencesContextValue {
  preferences: EditorPreferences
  setPreferences: (prefs: EditorPreferences) => void
}

const EditorPreferencesContext = createContext<EditorPreferencesContextValue | null>(null)

export function useEditorPreferences() {
  const ctx = useContext(EditorPreferencesContext)
  if (!ctx) throw new Error('useEditorPreferences must be used within EditorPreferencesProvider')
  return ctx
}

interface EditorPreferencesProviderProps {
  initial?: EditorPreferences | null
  children: React.ReactNode
}

export function EditorPreferencesProvider({ initial, children }: EditorPreferencesProviderProps) {
  const [preferences, setPreferences] = useState<EditorPreferences>(
    initial ? { ...EDITOR_DEFAULTS, ...initial } : EDITOR_DEFAULTS,
  )

  return (
    <EditorPreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </EditorPreferencesContext.Provider>
  )
}
