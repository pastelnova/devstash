import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getProfileStats, getEditorPreferences } from '@/lib/db/profile'
import { getSystemItemTypes, getSearchItems } from '@/lib/db/items'
import { getSidebarCollections, getSearchCollections } from '@/lib/db/collections'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { ProfileInfo } from '@/components/profile/ProfileInfo'
import { ProfileStats } from '@/components/profile/ProfileStats'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const userId = session.user.id

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect('/sign-in')

  const [stats, itemTypes, sidebarCollections, searchItems, searchCollections, editorPreferences] = await Promise.all([
    getProfileStats(userId),
    getSystemItemTypes(userId),
    getSidebarCollections(userId),
    getSearchItems(userId),
    getSearchCollections(userId),
    getEditorPreferences(userId),
  ])

  return (
    <DashboardShell itemTypes={itemTypes} sidebarCollections={sidebarCollections} searchItems={searchItems} searchCollections={searchCollections} user={session.user} editorPreferences={editorPreferences}>
      <div className="space-y-8 max-w-2xl">
        <div>
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Your profile information</p>
        </div>

        <ProfileInfo
          name={user.name}
          email={user.email}
          image={user.image}
          createdAt={user.createdAt}
        />

        <ProfileStats stats={stats} />
      </div>
    </DashboardShell>
  )
}
