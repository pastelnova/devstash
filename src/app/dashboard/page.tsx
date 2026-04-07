import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getCollections, getSidebarCollections } from '@/lib/db/collections'
import { getPinnedItems, getRecentItems, getItemStats, getSystemItemTypes } from '@/lib/db/items'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { CollectionsSection } from '@/components/dashboard/CollectionsSection'
import { PinnedItems } from '@/components/dashboard/PinnedItems'
import { RecentItems } from '@/components/dashboard/RecentItems'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const userId = session.user.id

  // Ensure user exists in DB (handles OAuth users on first visit)
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect('/sign-in')

  const [collections, pinnedItems, recentItems, stats, itemTypes, sidebarCollections] = await Promise.all([
    getCollections(userId),
    getPinnedItems(userId),
    getRecentItems(userId),
    getItemStats(userId),
    getSystemItemTypes(userId),
    getSidebarCollections(userId),
  ])

  return (
    <DashboardShell itemTypes={itemTypes} sidebarCollections={sidebarCollections} user={session.user}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your developer knowledge hub</p>
        </div>
        <StatsCards stats={stats} />
        <CollectionsSection collections={collections} />
        <PinnedItems items={pinnedItems} />
        <RecentItems items={recentItems} />
      </div>
    </DashboardShell>
  )
}
