'use client'

import { useState } from 'react'
import { Check, Copy, File } from 'lucide-react'
import { typeIconMap } from '@/lib/item-type-icons'
import type { ItemWithMeta } from '@/lib/db/items'
import { useItemDrawer } from './ItemDrawerContext'

export function ItemCard({ item }: { item: ItemWithMeta }) {
  const { openItem } = useItemDrawer()
  const [copied, setCopied] = useState(false)
  const Icon = item.type.icon ? (typeIconMap[item.type.icon] ?? File) : File
  const iconColor = item.type.color ?? '#94a3b8'

  const date = new Date(item.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const text = item.content ?? item.url ?? item.title
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={() => openItem(item.id)}
      className="group flex flex-col gap-3 rounded-lg border border-l-4 bg-card p-4 hover:bg-muted/30 transition-colors h-full text-left w-full cursor-pointer"
      style={{ borderLeftColor: iconColor }}
    >
      <div className="flex items-start gap-3">
        <div
          className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${iconColor}22` }}
        >
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{item.title}</p>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
          )}
        </div>
        <span
          role="button"
          tabIndex={0}
          onClick={handleCopy}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCopy(e as unknown as React.MouseEvent) }}
          className="shrink-0 rounded-md p-1 opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
          title="Copy"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
        </span>
      </div>
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}
