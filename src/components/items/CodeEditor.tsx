'use client'

import { useCallback, useMemo, useState } from 'react'
import Editor, { type BeforeMount, type OnMount } from '@monaco-editor/react'
import { Check, Copy } from 'lucide-react'
import { useEditorPreferences } from '@/components/settings/EditorPreferencesContext'
import { monokaiTheme, githubDarkTheme } from '@/lib/monaco-themes'

const LINE_HEIGHT = 19
const PADDING_Y = 24 // 12px top + 12px bottom
const MAX_HEIGHT = 400
const MIN_HEIGHT = 100

interface CodeEditorProps {
  value: string
  language?: string
  readOnly?: boolean
  onChange?: (value: string) => void
}

export function CodeEditor({ value, language, readOnly = false, onChange }: CodeEditorProps) {
  const { preferences } = useEditorPreferences()
  const [copied, setCopied] = useState(false)

  const editorHeight = useMemo(() => {
    const lineCount = (value || '').split('\n').length
    const contentHeight = lineCount * LINE_HEIGHT + PADDING_Y
    return Math.min(Math.max(contentHeight, MIN_HEIGHT), MAX_HEIGHT)
  }, [value])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // no-op
    }
  }

  const handleMount: OnMount = (editor) => {
    // Disable extra editor chrome we don't need
    editor.updateOptions({
      padding: { top: 12, bottom: 12 },
    })
  }

  const handleChange = useCallback(
    (val: string | undefined) => {
      onChange?.(val ?? '')
    },
    [onChange],
  )

  const handleBeforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme('monokai', monokaiTheme)
    monaco.editor.defineTheme('github-dark', githubDarkTheme)
  }

  const displayLanguage = language || 'text'

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-[#1e1e1e]">
      {/* macOS window header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#252526] border-b border-border">
        <div className="flex items-center gap-3">
          {/* macOS dots */}
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <div className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground font-mono">{displayLanguage}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Copy code"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <Editor
        height={editorHeight}
        value={value}
        language={language || 'plaintext'}
        theme={preferences.theme}
        beforeMount={handleBeforeMount}
        onChange={readOnly ? undefined : handleChange}
        onMount={handleMount}
        options={{
          readOnly,
          minimap: { enabled: preferences.minimap },
          fontSize: preferences.fontSize,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: preferences.wordWrap ? 'on' : 'off',
          tabSize: preferences.tabSize,
          renderLineHighlight: readOnly ? 'none' : 'line',
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          contextmenu: false,
          folding: true,
          lineDecorationsWidth: 8,
          lineNumbersMinChars: 3,
          domReadOnly: readOnly,
          cursorStyle: readOnly ? 'underline-thin' : 'line',
        }}
        loading={
          <div className="flex items-center justify-center h-[200px] text-xs text-muted-foreground">
            Loading editor...
          </div>
        }
      />
    </div>
  )
}
