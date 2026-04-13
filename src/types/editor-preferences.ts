export interface EditorPreferences {
  fontSize: number
  tabSize: number
  wordWrap: boolean
  minimap: boolean
  theme: string
}

export const EDITOR_DEFAULTS: EditorPreferences = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: 'vs-dark',
}

export const FONT_SIZE_OPTIONS = [12, 14, 16, 18, 20] as const
export const TAB_SIZE_OPTIONS = [2, 4, 8] as const
export const THEME_OPTIONS = [
  { value: 'vs-dark', label: 'VS Dark' },
  { value: 'monokai', label: 'Monokai' },
  { value: 'github-dark', label: 'GitHub Dark' },
] as const
