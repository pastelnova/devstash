import { mockItems } from '@/lib/mock-data'
import { ItemRow } from './ItemRow'

export function RecentItems() {
  const recent = [...mockItems]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  return (
    <section>
      <h2 className="text-base font-semibold mb-3">Recent Items</h2>
      <div className="rounded-lg border border-border bg-card px-4">
        {recent.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
