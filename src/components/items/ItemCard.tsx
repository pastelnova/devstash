import { File } from 'lucide-react'
import { typeIconMap } from '@/lib/item-type-icons'
import type { ItemWithMeta } from '@/lib/db/items'

export function ItemCard({ item }: { item: ItemWithMeta }) {
  const Icon = item.type.icon ? (typeIconMap[item.type.icon] ?? File) : File
  const iconColor = item.type.color ?? '#94a3b8'

  const date = new Date(item.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-l-4 bg-card p-4 hover:bg-muted/30 transition-colors h-full"
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
        <time className="text-xs text-muted-foreground shrink-0">{date}</time>
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
    </div>
  )
}
