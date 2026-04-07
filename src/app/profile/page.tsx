import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getProfileStats, hasPassword } from '@/lib/db/profile'
import { getSystemItemTypes } from '@/lib/db/items'
import { getSidebarCollections } from '@/lib/db/collections'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { ProfileInfo } from '@/components/profile/ProfileInfo'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { ChangePasswordSection } from '@/components/profile/ChangePasswordSection'
import { DeleteAccountSection } from '@/components/profile/DeleteAccountSection'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const userId = session.user.id

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect('/sign-in')

  const [stats, canChangePassword, itemTypes, sidebarCollections] = await Promise.all([
    getProfileStats(userId),
    hasPassword(userId),
    getSystemItemTypes(userId),
    getSidebarCollections(userId),
  ])

  return (
    <DashboardShell itemTypes={itemTypes} sidebarCollections={sidebarCollections} user={session.user}>
      <div className="space-y-8 max-w-2xl">
        <div>
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account</p>
        </div>

        <ProfileInfo
          name={user.name}
          email={user.email}
          image={user.image}
          createdAt={user.createdAt}
        />

        <ProfileStats stats={stats} />

        {canChangePassword && <ChangePasswordSection />}

        <DeleteAccountSection />
      </div>
    </DashboardShell>
  )
}
