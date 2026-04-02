import type { ItemWithMeta } from '@/lib/db/items'
import { ItemRow } from './ItemRow'

export function RecentItems({ items }: { items: ItemWithMeta[] }) {
  return (
    <section>
      <h2 className="text-base font-semibold mb-3">Recent Items</h2>
      <div className="rounded-lg border border-border bg-card px-4">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
