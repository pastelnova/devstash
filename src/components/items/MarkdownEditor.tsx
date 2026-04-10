'use client'

import { useMemo, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy } from 'lucide-react'

const MAX_HEIGHT = 400

interface MarkdownEditorProps {
  value: string
  readOnly?: boolean
  onChange?: (value: string) => void
}

export function MarkdownEditor({ value, readOnly = false, onChange }: MarkdownEditorProps) {
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<'write' | 'preview'>(readOnly ? 'preview' : 'write')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // no-op
    }
  }

  const preview = useMemo(
    () => (
      <Markdown remarkPlugins={[remarkGfm]}>{value || '*Nothing to preview*'}</Markdown>
    ),
    [value],
  )

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-[#1e1e1e]">
      {/* Header with tabs */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#252526] border-b border-border">
        <div className="flex items-center gap-1">
          {!readOnly && (
            <>
              <TabButton active={tab === 'write'} onClick={() => setTab('write')}>
                Write
              </TabButton>
              <TabButton active={tab === 'preview'} onClick={() => setTab('preview')}>
                Preview
              </TabButton>
            </>
          )}
          {readOnly && (
            <span className="text-[11px] text-muted-foreground font-mono">markdown</span>
          )}
        </div>

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
          {preview}
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
