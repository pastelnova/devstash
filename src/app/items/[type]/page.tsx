import { notFound, redirect } from 'next/navigation'
import { File } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSidebarCollections } from '@/lib/db/collections'
import {
  getSystemItemTypes,
  getSystemItemTypeBySlug,
  getItemsByType,
} from '@/lib/db/items'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { ItemCard } from '@/components/items/ItemCard'
import { typeIconMap } from '@/lib/item-type-icons'

export default async function ItemsByTypePage({
  params,
}: {
  params: Promise<{ type: string }>
}) {
  const { type: typeSlug } = await params

  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')
  const userId = session.user.id

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect('/sign-in')

  const itemType = await getSystemItemTypeBySlug(typeSlug)
  if (!itemType) notFound()

  const [items, itemTypes, sidebarCollections] = await Promise.all([
    getItemsByType(userId, itemType.id),
    getSystemItemTypes(userId),
    getSidebarCollections(userId),
  ])

  const Icon = itemType.icon ? (typeIconMap[itemType.icon] ?? File) : File
  const color = itemType.color ?? '#94a3b8'
  const title = `${itemType.name.charAt(0).toUpperCase()}${itemType.name.slice(1)}s`

  return (
    <DashboardShell
      itemTypes={itemTypes}
      sidebarCollections={sidebarCollections}
      user={session.user}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}22` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No {title.toLowerCase()} yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
