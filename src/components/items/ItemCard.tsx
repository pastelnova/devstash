'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, File, Pin, Star } from 'lucide-react'
import { toast } from 'sonner'
import { typeIconMap } from '@/lib/item-type-icons'
import { toggleItemFavorite } from '@/actions/items'
import type { ItemWithMeta } from '@/lib/db/items'
import { useItemDrawer } from './ItemDrawerContext'

export function ItemCard({ item }: { item: ItemWithMeta }) {
  const { openItem } = useItemDrawer()
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [isFavorite, setIsFavorite] = useState(item.isFavorite)
  useEffect(() => setIsFavorite(item.isFavorite), [item.isFavorite])
  const [favPending, startFavTransition] = useTransition()
  const Icon = item.type.icon ? (typeIconMap[item.type.icon] ?? File) : File
  const iconColor = item.type.color ?? '#94a3b8'

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const text = item.content ?? item.url ?? item.title
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    startFavTransition(async () => {
      const result = await toggleItemFavorite(item.id)
      if (result.success) {
        setIsFavorite(result.data.isFavorite)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openItem(item.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openItem(item.id) } }}
      className="group flex flex-col gap-3 rounded-lg border border-l-4 bg-card p-4 hover:bg-muted/30 transition-colors h-full text-left w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          <p className="text-sm font-medium leading-snug flex items-center gap-1">
            <span className="truncate">{item.title}</span>
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`shrink-0 rounded-md p-0.5 hover:bg-muted transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isFavorite ? '' : 'sm:opacity-0 sm:group-hover:opacity-100'}`}
              title={isFavorite ? 'Unfavorite' : 'Favorite'}
            >
              <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
            </button>
            {item.isPinned && <Pin className="h-3.5 w-3.5 shrink-0 fill-current text-muted-foreground" />}
          </p>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-md p-1 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-muted transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="Copy"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      </div>
      <div className="flex items-center justify-between mt-auto pt-1">
        {item.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : <div />}
        <time className="text-xs text-muted-foreground shrink-0 ml-2">
          {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </time>
      </div>
    </div>
  )
}
