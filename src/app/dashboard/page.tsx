import { prisma } from '@/lib/prisma'
import { getCollections } from '@/lib/db/collections'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { CollectionsSection } from '@/components/dashboard/CollectionsSection'
import { PinnedItems } from '@/components/dashboard/PinnedItems'
import { RecentItems } from '@/components/dashboard/RecentItems'

export default async function DashboardPage() {
  // TODO: replace with session user once auth is in place
  const user = await prisma.user.findUnique({ where: { email: 'demo@devstash.io' } })
  const collections = user ? await getCollections(user.id) : []

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your developer knowledge hub</p>
        </div>
        <StatsCards />
        <CollectionsSection collections={collections} />
        <PinnedItems />
        <RecentItems />
      </div>
    </DashboardShell>
  )
}
