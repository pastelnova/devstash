'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, File, Star } from 'lucide-react'
import { toast } from 'sonner'
import { typeIconMap } from '@/lib/item-type-icons'
import { toggleItemFavorite } from '@/actions/items'
import type { ItemWithMeta } from '@/lib/db/items'
import { useItemDrawer } from '@/components/items/ItemDrawerContext'

export function ItemRow({ item }: { item: ItemWithMeta }) {
  const { openItem } = useItemDrawer()
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [isFavorite, setIsFavorite] = useState(item.isFavorite)
  useEffect(() => setIsFavorite(item.isFavorite), [item.isFavorite])
  const [, startFavTransition] = useTransition()
  const Icon = item.type.icon ? (typeIconMap[item.type.icon] ?? File) : File
  const iconColor = item.type.color ?? '#94a3b8'

  const date = new Date(item.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

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
    <button
      type="button"
      onClick={() => openItem(item.id)}
      className="group flex items-start gap-3 rounded-lg border border-l-4 bg-card p-3 hover:bg-muted/30 transition-colors text-left w-full cursor-pointer"
      style={{ borderLeftColor: iconColor }}
    >
      <div
        className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: `${iconColor}22` }}
      >
        <Icon className="h-4 w-4" style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug flex items-center gap-1">
          <span className="truncate">{item.title}</span>
          <span
            role="button"
            tabIndex={0}
            onClick={handleToggleFavorite}
            onKeyDown={(e) => { if (e.key === 'Enter') handleToggleFavorite(e as unknown as React.MouseEvent) }}
            className={`shrink-0 rounded-md p-0.5 hover:bg-muted transition-all ${isFavorite ? '' : 'opacity-0 group-hover:opacity-100'}`}
            title={isFavorite ? 'Unfavorite' : 'Favorite'}
          >
            <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
          </span>
        </p>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
        )}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.tags.map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0 mt-0.5">
        <span
          role="button"
          tabIndex={0}
          onClick={handleCopy}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCopy(e as unknown as React.MouseEvent) }}
          className="rounded-md p-1 opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
          title="Copy"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
        </span>
        <time className="text-xs text-muted-foreground">{date}</time>
      </div>
    </button>
  )
}
