import { notFound, redirect } from 'next/navigation'
import { File } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSidebarCollections, getSearchCollections } from '@/lib/db/collections'
import {
  getSystemItemTypes,
  getSystemItemTypeBySlug,
  getItemsByType,
  getFileItemsByType,
  getSearchItems,
} from '@/lib/db/items'
import { ITEMS_PER_PAGE } from '@/lib/constants'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Pagination } from '@/components/Pagination'
import { ItemCard } from '@/components/items/ItemCard'
import { ImageCard } from '@/components/items/ImageCard'
import { FileRow } from '@/components/items/FileRow'
import { NewItemByTypeButton } from '@/components/items/NewItemByTypeButton'
import { typeIconMap } from '@/lib/item-type-icons'
import type { CreatableType } from '@/components/items/ItemCreateDialog'

const CREATABLE_SET = new Set(['snippet', 'prompt', 'command', 'note', 'link', 'file', 'image'])

export default async function ItemsByTypePage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { type: typeSlug } = await params
  const { page: pageParam } = await searchParams

  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')
  const userId = session.user.id

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect('/sign-in')

  const itemType = await getSystemItemTypeBySlug(typeSlug)
  if (!itemType) notFound()

  const isFileType = itemType.name.toLowerCase() === 'file'
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const [itemsResult, fileItemsResult, itemTypes, sidebarCollections, searchItems, searchCollections] = await Promise.all([
    isFileType ? Promise.resolve({ data: [], total: 0 }) : getItemsByType(userId, itemType.id, page, ITEMS_PER_PAGE),
    isFileType ? getFileItemsByType(userId, itemType.id, page, ITEMS_PER_PAGE) : Promise.resolve({ data: [], total: 0 }),
    getSystemItemTypes(userId),
    getSidebarCollections(userId),
    getSearchItems(userId),
    getSearchCollections(userId),
  ])

  const items = itemsResult.data
  const fileItems = fileItemsResult.data
  const totalCount = isFileType ? fileItemsResult.total : itemsResult.total
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const Icon = itemType.icon ? (typeIconMap[itemType.icon] ?? File) : File
  const color = itemType.color ?? '#94a3b8'
  const typeLower = itemType.name.toLowerCase()
  const title = `${itemType.name.charAt(0).toUpperCase()}${itemType.name.slice(1)}s`
  const creatableType = CREATABLE_SET.has(typeLower) ? (typeLower as CreatableType) : undefined
  const baseUrl = `/items/${typeSlug}`

  return (
    <DashboardShell
      itemTypes={itemTypes}
      sidebarCollections={sidebarCollections}
      searchItems={searchItems}
      searchCollections={searchCollections}
      user={session.user}
      defaultCreateType={creatableType}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}22` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalCount} {totalCount === 1 ? 'item' : 'items'}
            </p>
          </div>
          {creatableType && (
            <NewItemByTypeButton typeName={itemType.name.charAt(0).toUpperCase() + itemType.name.slice(1)} />
          )}
        </div>

        {totalCount === 0 ? (
          <div className="rounded-lg border border-dashed bg-card p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No {title.toLowerCase()} yet.
            </p>
          </div>
        ) : isFileType ? (
          <div className="flex flex-col gap-2">
            {fileItems.map((item) => (
              <FileRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) =>
              typeLower === 'image' ? (
                <ImageCard key={item.id} item={item} />
              ) : (
                <ItemCard key={item.id} item={item} />
              )
            )}
          </div>
        )}

        <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} />
      </div>
    </DashboardShell>
  )
}
