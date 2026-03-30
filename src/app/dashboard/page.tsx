import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { CollectionsSection } from '@/components/dashboard/CollectionsSection'
import { PinnedItems } from '@/components/dashboard/PinnedItems'
import { RecentItems } from '@/components/dashboard/RecentItems'

export default function DashboardPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your developer knowledge hub</p>
        </div>
        <StatsCards />
        <CollectionsSection />
        <PinnedItems />
        <RecentItems />
      </div>
    </DashboardShell>
  )
}
