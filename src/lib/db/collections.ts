import { prisma } from '@/lib/prisma'

export type CollectionBasic = {
  id: string
  name: string
  description: string | null
}

export async function createCollection(
  userId: string,
  input: { name: string; description: string | null },
): Promise<CollectionBasic> {
  return prisma.collection.create({
    data: {
      name: input.name,
      description: input.description,
      userId,
    },
    select: { id: true, name: true, description: true },
  })
}

export type CollectionTypeIcon = {
  icon: string
  color: string
}

export type CollectionWithMeta = {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
  itemCount: number
  typeIcons: CollectionTypeIcon[]
  dominantColor: string | null
}

export type SidebarCollection = {
  id: string
  name: string
  isFavorite: boolean
  dominantColor: string | null
}

export async function getSidebarCollections(userId: string): Promise<SidebarCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    include: {
      items: {
        include: { item: { include: { type: { select: { color: true } } } } },
        take: 20,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return collections.map((col) => {
    const colorCounts: Record<string, number> = {}
    for (const ci of col.items) {
      const color = ci.item.type.color
      if (color) colorCounts[color] = (colorCounts[color] ?? 0) + 1
    }
    const dominantColor =
      Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    return { id: col.id, name: col.name, isFavorite: col.isFavorite, dominantColor }
  })
}

/** Shared mapper for collection queries that include _count.items and nested item types. */
function toCollectionWithMeta(col: {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
  _count: { items: number }
  items: { item: { type: { id: string; icon: string | null; color: string | null } } }[]
}): CollectionWithMeta {
  const typeCounts: Record<string, { count: number; icon: string; color: string }> = {}
  for (const ci of col.items) {
    const { id, icon, color } = ci.item.type
    if (!typeCounts[id]) {
      typeCounts[id] = { count: 0, icon: icon ?? '', color: color ?? '' }
    }
    typeCounts[id].count++
  }

  const sorted = Object.values(typeCounts).sort((a, b) => b.count - a.count)
  const dominantColor = sorted[0]?.color ?? null
  const typeIcons = sorted
    .filter((t) => t.icon)
    .map((t) => ({ icon: t.icon, color: t.color }))

  return {
    id: col.id,
    name: col.name,
    description: col.description,
    isFavorite: col.isFavorite,
    itemCount: col._count.items,
    typeIcons,
    dominantColor,
  }
}

export async function getCollections(userId: string): Promise<CollectionWithMeta[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    include: {
      _count: { select: { items: true } },
      items: {
        include: { item: { include: { type: true } } },
        take: 20,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
  })

  return collections.map(toCollectionWithMeta)
}

export async function getAllCollections(userId: string): Promise<CollectionWithMeta[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    include: {
      _count: { select: { items: true } },
      items: {
        include: { item: { include: { type: true } } },
        take: 20,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return collections.map(toCollectionWithMeta)
}

export type CollectionDetail = {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
  itemCount: number
}

export async function getCollectionById(
  userId: string,
  collectionId: string,
): Promise<CollectionDetail | null> {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    include: { _count: { select: { items: true } } },
  })
  if (!collection) return null

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    itemCount: collection._count.items,
  }
}

export async function updateCollection(
  userId: string,
  collectionId: string,
  input: { name: string; description: string | null },
): Promise<CollectionBasic | null> {
  const existing = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
  })
  if (!existing) return null

  return prisma.collection.update({
    where: { id: collectionId },
    data: { name: input.name, description: input.description },
    select: { id: true, name: true, description: true },
  })
}

export async function deleteCollection(
  userId: string,
  collectionId: string,
): Promise<{ id: string } | null> {
  const existing = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
  })
  if (!existing) return null

  // Delete CollectionItem join rows first, then the collection
  await prisma.collectionItem.deleteMany({ where: { collectionId } })
  await prisma.collection.delete({ where: { id: collectionId } })

  return { id: collectionId }
}
