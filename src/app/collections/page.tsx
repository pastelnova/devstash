import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Star, MoreHorizontal, File, FolderOpen } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getAllCollections, getSidebarCollections } from '@/lib/db/collections'
import { getSystemItemTypes } from '@/lib/db/items'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { typeIconMap } from '@/lib/item-type-icons'

export default async function CollectionsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')
  const userId = session.user.id

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect('/sign-in')

  const [collections, itemTypes, sidebarCollections] = await Promise.all([
    getAllCollections(userId),
    getSystemItemTypes(userId),
    getSidebarCollections(userId),
  ])

  return (
    <DashboardShell itemTypes={itemTypes} sidebarCollections={sidebarCollections} user={session.user}>
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
              <Link
                key={col.id}
                href={`/collections/${col.id}`}
                className="rounded-lg border border-l-4 bg-card p-4 hover:bg-muted/30 transition-colors"
                style={{ borderLeftColor: col.dominantColor ?? undefined }}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-medium text-sm truncate">{col.name}</span>
                    {col.isFavorite && (
                      <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
                    )}
                  </div>
                  <button className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 -mr-1">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{col.itemCount} items</p>
                <p className="text-xs text-muted-foreground/70 mb-4 line-clamp-2">{col.description}</p>
                <div className="flex items-center gap-1.5">
                  {col.typeIcons.map((t) => {
                    const Icon = typeIconMap[t.icon] ?? File
                    return (
                      <Icon
                        key={t.icon}
                        className="h-3.5 w-3.5"
                        style={{ color: t.color || undefined }}
                      />
                    )
                  })}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
