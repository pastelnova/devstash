import { redirect } from 'next/navigation'
import { FolderOpen } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getAllCollections, getSidebarCollections, getSearchCollections } from '@/lib/db/collections'
import { getSystemItemTypes, getSearchItems } from '@/lib/db/items'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { CollectionCard } from '@/components/dashboard/CollectionCard'

export default async function CollectionsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')
  const userId = session.user.id

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect('/sign-in')

  const [collections, itemTypes, sidebarCollections, searchItems, searchCollections] = await Promise.all([
    getAllCollections(userId),
    getSystemItemTypes(userId),
    getSidebarCollections(userId),
    getSearchItems(userId),
    getSearchCollections(userId),
  ])

  return (
    <DashboardShell itemTypes={itemTypes} sidebarCollections={sidebarCollections} searchItems={searchItems} searchCollections={searchCollections} user={session.user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Collections</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
          </p>
        </div>

        {collections.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card p-12 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No collections yet. Create one to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {collections.map((col) => (
              <CollectionCard key={col.id} collection={col} />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
