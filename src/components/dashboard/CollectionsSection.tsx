import Link from 'next/link'
import { CollectionCard } from './CollectionCard'
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
          <CollectionCard key={col.id} collection={col} />
        ))}
      </div>
    </section>
  )
}
