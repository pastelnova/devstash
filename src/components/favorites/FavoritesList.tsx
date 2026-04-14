'use client'

import Link from 'next/link'
import { FolderOpen } from 'lucide-react'
import { typeIconMap } from '@/lib/item-type-icons'
import { useItemDrawer } from '@/components/items/ItemDrawerContext'
import type { FavoriteItem } from '@/lib/db/items'
import type { FavoriteCollection } from '@/lib/db/collections'

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function ItemRow({ item }: { item: FavoriteItem }) {
  const { openItem } = useItemDrawer()
  const IconComponent = item.type.icon ? typeIconMap[item.type.icon] : null

  return (
    <button
      onClick={() => openItem(item.id)}
      className="w-full flex items-center gap-3 px-3 py-1.5 text-left hover:bg-muted/50 transition-colors rounded-sm group"
    >
      <span
        className="flex items-center justify-center h-5 w-5 shrink-0 rounded-sm"
        style={{ color: item.type.color ?? undefined }}
      >
        {IconComponent && <IconComponent className="h-3.5 w-3.5" />}
      </span>
      <span className="flex-1 text-sm font-mono truncate">{item.title}</span>
      <span
        className="text-[11px] font-mono px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground shrink-0"
        style={{ borderLeft: `2px solid ${item.type.color ?? 'transparent'}` }}
      >
        {item.type.name}
      </span>
      <span className="text-xs font-mono text-muted-foreground shrink-0 hidden sm:block">
        {formatDate(item.updatedAt)}
      </span>
    </button>
  )
}

function CollectionRow({ collection }: { collection: FavoriteCollection }) {
  return (
    <Link
      href={`/collections/${collection.id}`}
      className="flex items-center gap-3 px-3 py-1.5 hover:bg-muted/50 transition-colors rounded-sm group"
    >
      <span className="flex items-center justify-center h-5 w-5 shrink-0 rounded-sm text-muted-foreground">
        <FolderOpen className="h-3.5 w-3.5" />
      </span>
      <span className="flex-1 text-sm font-mono truncate">{collection.name}</span>
      <span className="text-[11px] font-mono text-muted-foreground shrink-0">
        {collection.itemCount} {collection.itemCount === 1 ? 'item' : 'items'}
      </span>
      <span className="text-xs font-mono text-muted-foreground shrink-0 hidden sm:block">
        {formatDate(collection.updatedAt)}
      </span>
    </Link>
  )
}

interface FavoritesListProps {
  items: FavoriteItem[]
  collections: FavoriteCollection[]
}

export function FavoritesList({ items, collections }: FavoritesListProps) {
  return (
    <div className="space-y-6">
      {items.length > 0 && (
        <section>
          <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2 px-3">
            Items ({items.length})
          </h2>
          <div className="border rounded-md divide-y divide-border">
            {items.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {collections.length > 0 && (
        <section>
          <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2 px-3">
            Collections ({collections.length})
          </h2>
          <div className="border rounded-md divide-y divide-border">
            {collections.map((collection) => (
              <CollectionRow key={collection.id} collection={collection} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
