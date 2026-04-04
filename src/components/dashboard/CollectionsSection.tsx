import Link from 'next/link'
import { Star, MoreHorizontal, File } from 'lucide-react'
import { typeIconMap } from '@/lib/item-type-icons'
import type { CollectionWithMeta } from '@/lib/db/collections'

interface Props {
  collections: CollectionWithMeta[]
}

export function CollectionsSection({ collections }: Props) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Collections</h2>
        <Link
          href="/collections"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {collections.map((col) => (
          <div
            key={col.id}
            className="rounded-lg border bg-card p-4 hover:bg-muted/30 transition-colors"
            style={{ borderColor: col.dominantColor ?? undefined }}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-medium text-sm truncate">{col.name}</span>
                {col.isFavorite && (
                  <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
                )}
              </div>
              <button className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 -mr-1">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{col.itemCount} items</p>
            <p className="text-xs text-muted-foreground/70 mb-4 line-clamp-2">{col.description}</p>
            <div className="flex items-center gap-1.5">
              {col.typeIcons.map((iconKey) => {
                const Icon = typeIconMap[iconKey] ?? File
                return <Icon key={iconKey} className="h-3.5 w-3.5 text-muted-foreground/50" />
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
