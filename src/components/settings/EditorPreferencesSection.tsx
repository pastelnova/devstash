'use client'

import { useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { updateEditorPreferences } from '@/actions/editor-preferences'
import { useEditorPreferences } from '@/components/settings/EditorPreferencesContext'
import {
  FONT_SIZE_OPTIONS,
  TAB_SIZE_OPTIONS,
  THEME_OPTIONS,
} from '@/types/editor-preferences'

export function EditorPreferencesSection() {
  const { preferences, setPreferences } = useEditorPreferences()
  const [isPending, startTransition] = useTransition()

  function save(patch: Partial<typeof preferences>) {
    const next = { ...preferences, ...patch }
    setPreferences(next)
    startTransition(async () => {
      const result = await updateEditorPreferences(next)
      if (result.success) {
        toast.success('Editor preferences saved')
      } else {
        setPreferences(preferences)
        toast.error(result.error)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editor Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Font Size */}
        <div className="flex items-center justify-between">
          <Label htmlFor="fontSize">Font Size</Label>
          <Select
            value={String(preferences.fontSize)}
            onValueChange={(v) => save({ fontSize: Number(v) })}
            disabled={isPending}
          >
            <SelectTrigger id="fontSize" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tab Size */}
        <div className="flex items-center justify-between">
          <Label htmlFor="tabSize">Tab Size</Label>
          <Select
            value={String(preferences.tabSize)}
            onValueChange={(v) => save({ tabSize: Number(v) })}
            disabled={isPending}
          >
            <SelectTrigger id="tabSize" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAB_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} spaces
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Theme */}
        <div className="flex items-center justify-between">
          <Label htmlFor="theme">Theme</Label>
          <Select
            value={preferences.theme}
            onValueChange={(v) => v && save({ theme: v })}
            disabled={isPending}
          >
            <SelectTrigger id="theme" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEME_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Word Wrap */}
        <div className="flex items-center justify-between">
          <Label htmlFor="wordWrap">Word Wrap</Label>
          <Switch
            id="wordWrap"
            checked={preferences.wordWrap}
            onCheckedChange={(v) => save({ wordWrap: v })}
            disabled={isPending}
          />
        </div>

        {/* Minimap */}
        <div className="flex items-center justify-between">
          <Label htmlFor="minimap">Minimap</Label>
          <Switch
            id="minimap"
            checked={preferences.minimap}
            onCheckedChange={(v) => save({ minimap: v })}
            disabled={isPending}
          />
        </div>
      </CardContent>
    </Card>
  )
}
