'use client'

import type { ItemWithMeta } from '@/lib/db/items'
import { useItemDrawer } from './ItemDrawerContext'

export function ImageCard({ item }: { item: ItemWithMeta }) {
  const { openItem } = useItemDrawer()

  return (
    <button
      type="button"
      onClick={() => openItem(item.id)}
      className="group overflow-hidden rounded-lg border bg-card text-left w-full cursor-pointer"
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
        <p className="text-sm font-medium leading-snug truncate">{item.title}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
        )}
      </div>
    </button>
  )
}
