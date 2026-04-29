'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'
import Editor, { type BeforeMount, type OnMount } from '@monaco-editor/react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy, Crown, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useEditorPreferences } from '@/components/settings/EditorPreferencesContext'
import { monokaiTheme, githubDarkTheme } from '@/lib/monaco-themes'
import { explainCode } from '@/actions/ai'

const LINE_HEIGHT = 19
const PADDING_Y = 24 // 12px top + 12px bottom
const MAX_HEIGHT = 400
const MIN_HEIGHT = 100

interface CodeEditorProps {
  value: string
  language?: string
  readOnly?: boolean
  onChange?: (value: string) => void
  /** Show the Explain button (only in drawer view mode for snippets/commands) */
  showExplain?: boolean
  /** Whether the user has a Pro subscription */
  isPro?: boolean
}

export function CodeEditor({ value, language, readOnly = false, onChange, showExplain, isPro }: CodeEditorProps) {
  const { preferences } = useEditorPreferences()
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'code' | 'explain'>('code')
  const [explanation, setExplanation] = useState<string | null>(null)
  const [explainPending, startExplainTransition] = useTransition()

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

  const handleExplain = () => {
    if (!isPro) {
      toast.error('AI features require a Pro subscription')
      return
    }

    startExplainTransition(async () => {
      const itemType = language === 'bash' || language === 'shell' || language === 'sh' || language === 'powershell' || language === 'bat'
        ? 'command' as const
        : 'snippet' as const

      const result = await explainCode({
        code: value,
        language: language || '',
        type: itemType,
      })

      if (result.success) {
        setExplanation(result.data.explanation)
        setActiveTab('explain')
      } else {
        toast.error(result.error)
      }
    })
  }

  const displayLanguage = language || 'text'
  const hasExplanation = explanation !== null

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

          {/* Code / Explain tabs — only shown after explanation is generated */}
          {hasExplanation && showExplain && (
            <div className="flex items-center gap-0.5 ml-2">
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  activeTab === 'code'
                    ? 'text-foreground bg-muted/50'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Code
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('explain')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  activeTab === 'explain'
                    ? 'text-foreground bg-muted/50'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Explain
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground font-mono">{displayLanguage}</span>

          {/* Explain button */}
          {showExplain && (
            <button
              type="button"
              onClick={handleExplain}
              disabled={explainPending}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
              aria-label={isPro ? 'Explain code' : 'AI features require Pro subscription'}
              title={isPro ? 'Explain code' : 'AI features require Pro subscription'}
            >
              {explainPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isPro ? (
                <Sparkles className="h-3 w-3" />
              ) : (
                <Crown className="h-3 w-3" />
              )}
              <span>Explain</span>
            </button>
          )}

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

      {/* Content area */}
      {activeTab === 'explain' && explanation ? (
        <div
          className="overflow-y-auto px-4 py-3 prose prose-invert prose-sm max-w-none"
          style={{ maxHeight: MAX_HEIGHT }}
        >
          <Markdown remarkPlugins={[remarkGfm]}>{explanation}</Markdown>
        </div>
      ) : (
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
      )}
    </div>
  )
}
