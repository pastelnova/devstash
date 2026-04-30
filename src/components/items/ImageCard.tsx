'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pin, Star } from 'lucide-react'
import { toast } from 'sonner'
import { toggleItemFavorite } from '@/actions/items'
import type { ItemWithMeta } from '@/lib/db/items'
import { useItemDrawer } from './ItemDrawerContext'

export function ImageCard({ item }: { item: ItemWithMeta }) {
  const { openItem } = useItemDrawer()
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(item.isFavorite)
  useEffect(() => setIsFavorite(item.isFavorite), [item.isFavorite])
  const [, startFavTransition] = useTransition()

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
      className="group overflow-hidden rounded-lg border bg-card text-left w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="aspect-video overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/download/${item.id}`}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium leading-snug truncate flex-1">{item.title}</p>
          <button
            type="button"
            onClick={handleToggleFavorite}
            className="shrink-0 rounded-md p-0.5 hover:bg-muted transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title={isFavorite ? 'Unfavorite' : 'Favorite'}
          >
            <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 transition-opacity'}`} />
          </button>
          {item.isPinned && <Pin className="h-3.5 w-3.5 shrink-0 fill-current text-muted-foreground" />}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
        )}
      </div>
    </div>
  )
}
