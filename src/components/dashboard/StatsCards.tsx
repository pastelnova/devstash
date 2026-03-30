import { mockCollections, mockItems, mockItemTypes } from '@/lib/mock-data'
import { Package, FolderOpen, Star, Bookmark } from 'lucide-react'

const totalItems = mockItemTypes.reduce((sum, t) => sum + t.count, 0)
const totalCollections = mockCollections.length
const favoriteItems = mockItems.filter((i) => i.isFavorite).length
const favoriteCollections = mockCollections.filter((c) => c.isFavorite).length

const stats = [
  { label: 'Items', value: totalItems, icon: Package },
  { label: 'Collections', value: totalCollections, icon: FolderOpen },
  { label: 'Favorite Items', value: favoriteItems, icon: Star },
  { label: 'Favorite Collections', value: favoriteCollections, icon: Bookmark },
]

export function StatsCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(({ label, value, icon: Icon }) => (
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
