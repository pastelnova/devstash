'use client'

import { File } from 'lucide-react'
import { typeIconMap } from '@/lib/item-type-icons'
import type { ItemWithMeta } from '@/lib/db/items'
import { useItemDrawer } from '@/components/items/ItemDrawerContext'

export function ItemRow({ item }: { item: ItemWithMeta }) {
  const { openItem } = useItemDrawer()
  const Icon = item.type.icon ? (typeIconMap[item.type.icon] ?? File) : File
  const iconColor = item.type.color ?? '#94a3b8'

  const date = new Date(item.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <button
      type="button"
      onClick={() => openItem(item.id)}
      className="flex items-start gap-3 rounded-lg border border-l-4 bg-card p-3 hover:bg-muted/30 transition-colors text-left w-full cursor-pointer"
      style={{ borderLeftColor: iconColor }}
    >
      <div
        className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: `${iconColor}22` }}
      >
        <Icon className="h-4 w-4" style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug">{item.title}</p>
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
      <time className="text-xs text-muted-foreground shrink-0 mt-0.5">{date}</time>
    </button>
  )
}
