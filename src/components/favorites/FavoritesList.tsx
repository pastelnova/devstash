'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { FolderOpen, ArrowUpDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { typeIconMap } from '@/lib/item-type-icons'
import { useItemDrawer } from '@/components/items/ItemDrawerContext'
import type { FavoriteItem } from '@/lib/db/items'
import type { FavoriteCollection } from '@/lib/db/collections'

type SortOption = 'name-asc' | 'name-desc' | 'date-newest' | 'date-oldest' | 'type'

const SORT_LABELS: Record<SortOption, string> = {
  'name-asc': 'Name A–Z',
  'name-desc': 'Name Z–A',
  'date-newest': 'Newest first',
  'date-oldest': 'Oldest first',
  'type': 'Item type',
}

const ITEM_SORT_OPTIONS: SortOption[] = ['name-asc', 'name-desc', 'date-newest', 'date-oldest', 'type']
const COLLECTION_SORT_OPTIONS: SortOption[] = ['name-asc', 'name-desc', 'date-newest', 'date-oldest']

function sortItems(items: FavoriteItem[], sort: SortOption): FavoriteItem[] {
  const sorted = [...items]
  switch (sort) {
    case 'name-asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
    case 'name-desc':
      return sorted.sort((a, b) => b.title.localeCompare(a.title))
    case 'date-newest':
      return sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    case 'date-oldest':
      return sorted.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
    case 'type':
      return sorted.sort((a, b) => a.type.name.localeCompare(b.type.name) || a.title.localeCompare(b.title))
    default:
      return sorted
  }
}

function sortCollections(collections: FavoriteCollection[], sort: SortOption): FavoriteCollection[] {
  const sorted = [...collections]
  switch (sort) {
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name))
    case 'date-newest':
      return sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    case 'date-oldest':
      return sorted.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
    default:
      return sorted
  }
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function SortControl({ value, onChange, options }: { value: SortOption; onChange: (v: SortOption) => void; options: SortOption[] }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortOption)}>
      <SelectTrigger className="h-7 w-auto gap-1.5 border-none bg-transparent px-2 text-xs font-mono text-muted-foreground hover:text-foreground">
        <ArrowUpDown className="h-3 w-3" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt} className="text-xs font-mono">
            {SORT_LABELS[opt]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
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
      <span className="flex-1 text-sm font-mono truncate min-w-0">{item.title}</span>
      <span
        className="text-[11px] font-mono px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground shrink-0 hidden sm:inline-block"
        style={{ borderLeft: `2px solid ${item.type.color ?? 'transparent'}` }}
      >
        {item.type.name}
      </span>
      <span
        className="flex items-center justify-center h-5 w-5 shrink-0 rounded-sm sm:hidden"
        style={{ color: item.type.color ?? undefined }}
      >
        {IconComponent && <IconComponent className="h-3 w-3" />}
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
  const [itemSort, setItemSort] = useState<SortOption>('date-newest')
  const [collectionSort, setCollectionSort] = useState<SortOption>('date-newest')

  const sortedItems = useMemo(() => sortItems(items, itemSort), [items, itemSort])
  const sortedCollections = useMemo(() => sortCollections(collections, collectionSort), [collections, collectionSort])

  return (
    <div className="space-y-6">
      {items.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2 px-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Items ({items.length})
            </h2>
            <SortControl value={itemSort} onChange={setItemSort} options={ITEM_SORT_OPTIONS} />
          </div>
          <div className="border rounded-md divide-y divide-border">
            {sortedItems.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {collections.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2 px-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Collections ({collections.length})
            </h2>
            <SortControl value={collectionSort} onChange={setCollectionSort} options={COLLECTION_SORT_OPTIONS} />
          </div>
          <div className="border rounded-md divide-y divide-border">
            {sortedCollections.map((collection) => (
              <CollectionRow key={collection.id} collection={collection} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
