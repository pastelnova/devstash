import { prisma } from '@/lib/prisma'

export type ItemWithMeta = {
  id: string
  title: string
  description: string | null
  type: {
    icon: string | null
    color: string | null
  }
  tags: string[]
  createdAt: Date
}

export type ItemStats = {
  totalItems: number
  totalCollections: number
  favoriteItems: number
  favoriteCollections: number
}

export async function getPinnedItems(userId: string): Promise<ItemWithMeta[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    include: {
      type: { select: { icon: true, color: true } },
      tags: { include: { tag: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    type: { icon: item.type.icon, color: item.type.color },
    tags: item.tags.map((t) => t.tag.name),
    createdAt: item.createdAt,
  }))
}

export async function getRecentItems(userId: string): Promise<ItemWithMeta[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    include: {
      type: { select: { icon: true, color: true } },
      tags: { include: { tag: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    type: { icon: item.type.icon, color: item.type.color },
    tags: item.tags.map((t) => t.tag.name),
    createdAt: item.createdAt,
  }))
}

export async function getItemStats(userId: string): Promise<ItemStats> {
  const [totalItems, totalCollections, favoriteItems, favoriteCollections] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ])

  return { totalItems, totalCollections, favoriteItems, favoriteCollections }
}
