'use client'

import { useMemo, useState, useTransition } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy, Crown, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { optimizePrompt } from '@/actions/ai'

const MAX_HEIGHT = 400

interface MarkdownEditorProps {
  value: string
  readOnly?: boolean
  onChange?: (value: string) => void
  /** Show the Optimize button (only in drawer view mode for prompts) */
  showOptimize?: boolean
  /** Whether the user has a Pro subscription */
  isPro?: boolean
  /** Callback when user accepts the optimized content */
  onAcceptOptimized?: (optimized: string) => void
}

export function MarkdownEditor({ value, readOnly = false, onChange, showOptimize, isPro, onAcceptOptimized }: MarkdownEditorProps) {
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<'write' | 'preview' | 'original' | 'optimized'>(readOnly ? 'preview' : 'write')
  const [optimizedContent, setOptimizedContent] = useState<string | null>(null)
  const [optimizePending, startOptimizeTransition] = useTransition()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // no-op
    }
  }

  const handleOptimize = () => {
    if (!isPro) {
      toast.error('AI features require a Pro subscription')
      return
    }

    startOptimizeTransition(async () => {
      const result = await optimizePrompt({ content: value })

      if (result.success) {
        setOptimizedContent(result.data.optimized)
        setTab('optimized')
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleAccept = () => {
    if (optimizedContent) {
      onAcceptOptimized?.(optimizedContent)
      toast.success('Optimized prompt applied')
    }
  }

  const handleDismiss = () => {
    setOptimizedContent(null)
    setTab(readOnly ? 'preview' : 'write')
  }

  const hasOptimized = optimizedContent !== null

  const preview = useMemo(
    () => (
      <Markdown remarkPlugins={[remarkGfm]}>{value || '*Nothing to preview*'}</Markdown>
    ),
    [value],
  )

  const optimizedPreview = useMemo(
    () =>
      optimizedContent ? (
        <Markdown remarkPlugins={[remarkGfm]}>{optimizedContent}</Markdown>
      ) : null,
    [optimizedContent],
  )

  // Determine which content to show
  const showContent = tab === 'optimized' && optimizedContent
    ? optimizedPreview
    : tab === 'original'
      ? preview
      : preview

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-[#1e1e1e]">
      {/* Header with tabs */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#252526] border-b border-border">
        <div className="flex items-center gap-1">
          {!readOnly && !hasOptimized && (
            <>
              <TabButton active={tab === 'write'} onClick={() => setTab('write')}>
                Write
              </TabButton>
              <TabButton active={tab === 'preview'} onClick={() => setTab('preview')}>
                Preview
              </TabButton>
            </>
          )}
          {readOnly && !hasOptimized && (
            <span className="text-[11px] text-muted-foreground font-mono">markdown</span>
          )}

          {/* Original / Optimized tabs — only shown after optimization */}
          {hasOptimized && showOptimize && (
            <div className="flex items-center gap-0.5">
              <TabButton active={tab === 'original'} onClick={() => setTab('original')}>
                Original
              </TabButton>
              <TabButton active={tab === 'optimized'} onClick={() => setTab('optimized')}>
                Optimized
              </TabButton>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Accept / Dismiss buttons when viewing optimized result */}
          {hasOptimized && showOptimize && (
            <>
              <button
                type="button"
                onClick={handleAccept}
                className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-emerald-400 hover:bg-emerald-400/10 transition-colors"
              >
                <Check className="h-3 w-3" />
                <span>Use this</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <span>Dismiss</span>
              </button>
            </>
          )}

          {/* Optimize button */}
          {showOptimize && !hasOptimized && (
            <button
              type="button"
              onClick={handleOptimize}
              disabled={optimizePending}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
              aria-label={isPro ? 'Optimize prompt' : 'AI features require Pro subscription'}
              title={isPro ? 'Optimize prompt' : 'AI features require Pro subscription'}
            >
              {optimizePending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isPro ? (
                <Sparkles className="h-3 w-3" />
              ) : (
                <Crown className="h-3 w-3" />
              )}
              <span>Optimize</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Copy content"
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
      {tab === 'write' && !readOnly ? (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full bg-[#1e1e1e] text-sm text-foreground font-mono px-4 py-3 outline-none resize-none"
          style={{ minHeight: 100, maxHeight: MAX_HEIGHT }}
          placeholder="Write markdown here..."
        />
      ) : (
        <div
          className="prose prose-invert prose-sm max-w-none px-4 py-3 overflow-y-auto"
          style={{ maxHeight: MAX_HEIGHT }}
        >
          {showContent}
        </div>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
        active
          ? 'bg-[#1e1e1e] text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}
