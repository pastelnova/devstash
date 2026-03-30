import { Pin } from 'lucide-react'
import { mockItems } from '@/lib/mock-data'
import { ItemRow } from './ItemRow'

export function PinnedItems() {
  const pinned = mockItems.filter((i) => i.isPinned)

  if (pinned.length === 0) return null

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Pin className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-base font-semibold">Pinned</h2>
      </div>
      <div className="rounded-lg border border-border bg-card px-4">
        {pinned.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
