import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { typeIconMap } from '@/lib/item-type-icons'
import type { ProfileStats as ProfileStatsType } from '@/lib/db/profile'

interface ProfileStatsProps {
  stats: ProfileStatsType
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-6">
          <div>
            <p className="text-2xl font-semibold">{stats.totalItems}</p>
            <p className="text-xs text-muted-foreground">Items</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{stats.totalCollections}</p>
            <p className="text-xs text-muted-foreground">Collections</p>
          </div>
        </div>

        {stats.itemsByType.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Items by type</p>
            <div className="flex flex-wrap gap-3">
              {stats.itemsByType.map((t) => {
                const Icon = t.icon ? typeIconMap[t.icon] : null
                return (
                  <div
                    key={t.name}
                    className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-1.5 text-sm"
                  >
                    {Icon && <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: t.color ?? undefined }} />}
                    <span className="text-muted-foreground capitalize">{t.name}</span>
                    <span className="font-semibold tabular-nums">{t.count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
