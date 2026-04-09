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

export type SystemItemType = {
  id: string
  name: string
  icon: string | null
  color: string | null
  count: number
}

export async function getSystemItemTypes(userId: string): Promise<SystemItemType[]> {
  const types = await prisma.itemType.findMany({
    where: { isSystem: true },
    include: {
      _count: { select: { items: { where: { userId } } } },
    },
  })

  return types.map((t) => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    color: t.color,
    count: t._count.items,
  }))
}

export type ItemTypeInfo = {
  id: string
  name: string
  icon: string | null
  color: string | null
}

/**
 * Resolve a URL slug (e.g. "snippets" or "snippet") to a system item type.
 * System type names are stored singular & lowercase ("snippet", "note", ...).
 */
export async function getSystemItemTypeBySlug(slug: string): Promise<ItemTypeInfo | null> {
  const normalized = slug.toLowerCase()
  const candidates = [normalized]
  if (normalized.endsWith('s')) candidates.push(normalized.slice(0, -1))

  const type = await prisma.itemType.findFirst({
    where: { isSystem: true, name: { in: candidates } },
    select: { id: true, name: true, icon: true, color: true },
  })
  return type
}

export async function getItemsByType(userId: string, typeId: string): Promise<ItemWithMeta[]> {
  const items = await prisma.item.findMany({
    where: { userId, typeId },
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

export type ItemDetail = {
  id: string
  title: string
  description: string | null
  content: string | null
  contentType: string
  language: string | null
  url: string | null
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  isFavorite: boolean
  isPinned: boolean
  type: {
    id: string
    name: string
    icon: string | null
    color: string | null
  }
  collection: { id: string; name: string } | null
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export async function getItemDetail(userId: string, itemId: string): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    include: {
      type: { select: { id: true, name: true, icon: true, color: true } },
      collection: { select: { id: true, name: true } },
      tags: { include: { tag: { select: { name: true } } } },
    },
  })

  if (!item) return null

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    content: item.content,
    contentType: item.contentType,
    language: item.language,
    url: item.url,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    type: item.type,
    collection: item.collection,
    tags: item.tags.map((t) => t.tag.name),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
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
