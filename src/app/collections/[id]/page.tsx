import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, File, FolderOpen } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getCollectionById, getSidebarCollections, getSearchCollections } from '@/lib/db/collections'
import { getSystemItemTypes, getItemsByCollection, getSearchItems } from '@/lib/db/items'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { CollectionActions } from '@/components/dashboard/CollectionActions'
import { ItemCard } from '@/components/items/ItemCard'
import { ImageCard } from '@/components/items/ImageCard'
import { FileRow } from '@/components/items/FileRow'
import { typeIconMap } from '@/lib/item-type-icons'

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')
  const userId = session.user.id

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect('/sign-in')

  const collection = await getCollectionById(userId, id)
  if (!collection) notFound()

  const [allItems, itemTypes, sidebarCollections, searchItems, searchCollections] = await Promise.all([
    getItemsByCollection(userId, id),
    getSystemItemTypes(userId),
    getSidebarCollections(userId),
    getSearchItems(userId),
    getSearchCollections(userId),
  ])

  const regularItems = allItems.filter((i) => i.typeName.toLowerCase() !== 'image' && i.typeName.toLowerCase() !== 'file')
  const imageItems = allItems.filter((i) => i.typeName.toLowerCase() === 'image')
  const fileItems = allItems.filter((i) => i.typeName.toLowerCase() === 'file')

  // Count items per type for the header breakdown
  const typeCounts: Record<string, { count: number; icon: string | null; color: string | null }> = {}
  for (const item of allItems) {
    const name = item.typeName.toLowerCase()
    if (!typeCounts[name]) {
      typeCounts[name] = { count: 0, icon: item.type.icon, color: item.type.color }
    }
    typeCounts[name].count++
  }

  return (
    <DashboardShell itemTypes={itemTypes} sidebarCollections={sidebarCollections} searchItems={searchItems} searchCollections={searchCollections} user={session.user}>
      <div className="space-y-6">
        <div>
          <Link
            href="/collections"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Collections
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">
              {collection.name}
              <span className="text-base font-normal text-muted-foreground ml-2">
                ({collection.itemCount} {collection.itemCount === 1 ? 'item' : 'items'})
              </span>
            </h1>
            <CollectionActions collection={collection} redirectOnDelete="/collections" />
          </div>
          {collection.description && (
            <p className="text-sm text-muted-foreground mt-1">{collection.description}</p>
          )}
          {allItems.length > 0 && (
            <div className="flex items-center gap-3 mt-2">
              {Object.entries(typeCounts).map(([name, { count, icon, color }]) => {
                const Icon = typeIconMap[icon ?? ''] ?? File
                return (
                  <div key={name} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Icon className="h-3 w-3" style={{ color: color ?? undefined }} />
                    <span>{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {allItems.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card p-12 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No items in this collection yet.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {regularItems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {regularItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}

            {imageItems.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold mb-3">Images</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {imageItems.map((item) => (
                    <ImageCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            {fileItems.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold mb-3">Files</h2>
                <div className="flex flex-col gap-2">
                {fileItems.map((item) => (
                  <FileRow
                    key={item.id}
                    item={{
                      id: item.id,
                      title: item.title,
                      fileName: item.fileName,
                      fileSize: item.fileSize,
                      createdAt: item.createdAt,
                      type: item.type,
                    }}
                  />
                ))}
              </div>
              </section>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
