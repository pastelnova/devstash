import { Package, FolderOpen, Star, Bookmark } from 'lucide-react'
import type { ItemStats } from '@/lib/db/items'

export function StatsCards({ stats }: { stats: ItemStats }) {
  const cards = [
    { label: 'Items', value: stats.totalItems, icon: Package },
    { label: 'Collections', value: stats.totalCollections, icon: FolderOpen },
    { label: 'Favorite Items', value: stats.favoriteItems, icon: Star },
    { label: 'Fav. Collections', value: stats.favoriteCollections, icon: Bookmark },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map(({ label, value, icon: Icon }) => (
        <div key={label} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{label}</span>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      ))}
    </div>
  )
}
