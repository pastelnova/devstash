import { prisma } from '@/lib/prisma'
import { DASHBOARD_RECENT_ITEMS_LIMIT } from '@/lib/constants'
import type { PrismaClient } from '../../../generated/prisma/client'

type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]

export type ItemWithMeta = {
  id: string
  title: string
  content: string | null
  url: string | null
  description: string | null
  isFavorite: boolean
  type: {
    icon: string | null
    color: string | null
  }
  tags: string[]
  createdAt: Date
}

/** Shared Prisma-to-ItemWithMeta mapper for item queries that include type + tags. */
function toItemWithMeta(item: {
  id: string
  title: string
  content: string | null
  url: string | null
  description: string | null
  isFavorite: boolean
  type: { icon: string | null; color: string | null }
  tags: { tag: { name: string } }[]
  createdAt: Date
}): ItemWithMeta {
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    url: item.url,
    description: item.description,
    isFavorite: item.isFavorite,
    type: { icon: item.type.icon, color: item.type.color },
    tags: item.tags.map((t) => t.tag.name),
    createdAt: item.createdAt,
  }
}

/**
 * Upsert tags and create ItemTag joins inside a transaction.
 * Deletes existing ItemTag rows for the item first, then upserts Tag rows
 * (unique per name+userId) and recreates the joins.
 */
async function upsertTags(
  tx: TransactionClient,
  userId: string,
  itemId: string,
  tags: string[],
): Promise<void> {
  await tx.itemTag.deleteMany({ where: { itemId } })
  for (const name of tags) {
    const tag = await tx.tag.upsert({
      where: { name_userId: { name, userId } },
      update: {},
      create: { name, userId },
    })
    await tx.itemTag.create({ data: { itemId, tagId: tag.id } })
  }
}

/**
 * Replace all CollectionItem joins for an item with the given collectionIds.
 */
async function upsertCollections(
  tx: TransactionClient,
  itemId: string,
  collectionIds: string[],
): Promise<void> {
  await tx.collectionItem.deleteMany({ where: { itemId } })
  for (const collectionId of collectionIds) {
    await tx.collectionItem.create({ data: { itemId, collectionId } })
  }
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

  return items.map(toItemWithMeta)
}

export async function getRecentItems(userId: string): Promise<ItemWithMeta[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    include: {
      type: { select: { icon: true, color: true } },
      tags: { include: { tag: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: DASHBOARD_RECENT_ITEMS_LIMIT,
  })

  return items.map(toItemWithMeta)
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

export type PaginatedResult<T> = {
  data: T[]
  total: number
}

export async function getItemsByType(
  userId: string,
  typeId: string,
  page: number = 1,
  perPage: number = 21,
): Promise<PaginatedResult<ItemWithMeta>> {
  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where: { userId, typeId },
      include: {
        type: { select: { icon: true, color: true } },
        tags: { include: { tag: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.item.count({ where: { userId, typeId } }),
  ])

  return { data: items.map(toItemWithMeta), total }
}

export type CollectionItemWithMeta = ItemWithMeta & {
  typeName: string
  fileName: string | null
  fileSize: number | null
}

export async function getItemsByCollection(
  userId: string,
  collectionId: string,
  page: number = 1,
  perPage: number = 21,
): Promise<PaginatedResult<CollectionItemWithMeta>> {
  const where = {
    userId,
    collections: { some: { collectionId } },
  }

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      include: {
        type: { select: { name: true, icon: true, color: true } },
        tags: { include: { tag: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.item.count({ where }),
  ])

  return {
    data: items.map((item) => ({
      ...toItemWithMeta(item),
      typeName: item.type.name,
      fileName: item.fileName,
      fileSize: item.fileSize,
    })),
    total,
  }
}

export type FileItemMeta = {
  id: string
  title: string
  fileName: string | null
  fileSize: number | null
  isFavorite: boolean
  createdAt: Date
  type: {
    icon: string | null
    color: string | null
  }
}

export async function getFileItemsByType(
  userId: string,
  typeId: string,
  page: number = 1,
  perPage: number = 21,
): Promise<PaginatedResult<FileItemMeta>> {
  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where: { userId, typeId },
      select: {
        id: true,
        title: true,
        fileName: true,
        fileSize: true,
        isFavorite: true,
        createdAt: true,
        type: { select: { icon: true, color: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.item.count({ where: { userId, typeId } }),
  ])

  return { data: items, total }
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
  collections: { id: string; name: string }[]
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export async function getItemDetail(userId: string, itemId: string): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    include: {
      type: { select: { id: true, name: true, icon: true, color: true } },
      collections: { include: { collection: { select: { id: true, name: true } } } },
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
    collections: item.collections.map((c) => c.collection),
    tags: item.tags.map((t) => t.tag.name),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

export type UpdateItemInput = {
  title: string
  description: string | null
  content: string | null
  url: string | null
  language: string | null
  tags: string[]
  collectionIds: string[]
}

/**
 * Update an item's editable fields and its tag set.
 * Tag strategy: remove all existing ItemTag rows for the item, then
 * upsert Tag rows (unique per name+userId) and recreate the joins.
 * Caller must have verified ownership.
 */
export async function updateItem(
  userId: string,
  itemId: string,
  input: UpdateItemInput,
): Promise<ItemDetail> {
  await prisma.$transaction(async (tx) => {
    await tx.item.update({
      where: { id: itemId },
      data: {
        title: input.title,
        description: input.description,
        content: input.content,
        url: input.url,
        language: input.language,
      },
    })

    await upsertTags(tx, userId, itemId, input.tags)
    await upsertCollections(tx, itemId, input.collectionIds)
  })

  const updated = await getItemDetail(userId, itemId)
  if (!updated) {
    throw new Error('Item not found after update')
  }
  return updated
}

export type CreateItemInput = {
  title: string
  description: string | null
  content: string | null
  url: string | null
  language: string | null
  typeId: string
  tags: string[]
  collectionIds: string[]
}

export type CreateFileItemInput = {
  title: string
  description: string | null
  typeId: string
  tags: string[]
  collectionIds: string[]
  fileUrl: string
  fileName: string
  fileSize: number
}

/**
 * Create a new item for the given user. Tag strategy mirrors `updateItem`:
 * upsert Tag rows (unique per name+userId) and create the joins.
 */
export async function createItem(
  userId: string,
  input: CreateItemInput,
): Promise<ItemDetail> {
  const newItemId = await prisma.$transaction(async (tx) => {
    const created = await tx.item.create({
      data: {
        title: input.title,
        description: input.description,
        content: input.content,
        url: input.url,
        language: input.language,
        contentType: 'text',
        userId,
        typeId: input.typeId,
      },
      select: { id: true },
    })

    await upsertTags(tx, userId, created.id, input.tags)
    await upsertCollections(tx, created.id, input.collectionIds)

    return created.id
  })

  const detail = await getItemDetail(userId, newItemId)
  if (!detail) {
    throw new Error('Item not found after create')
  }
  return detail
}

/**
 * Create a new file/image item. Tag strategy mirrors `createItem`.
 */
export async function createFileItem(
  userId: string,
  input: CreateFileItemInput,
): Promise<ItemDetail> {
  const newItemId = await prisma.$transaction(async (tx) => {
    const created = await tx.item.create({
      data: {
        title: input.title,
        description: input.description,
        contentType: 'file',
        fileUrl: input.fileUrl,
        fileName: input.fileName,
        fileSize: input.fileSize,
        userId,
        typeId: input.typeId,
      },
      select: { id: true },
    })

    await upsertTags(tx, userId, created.id, input.tags)
    await upsertCollections(tx, created.id, input.collectionIds)

    return created.id
  })

  const detail = await getItemDetail(userId, newItemId)
  if (!detail) {
    throw new Error('Item not found after create')
  }
  return detail
}

/**
 * Delete an item. Cascades remove ItemTag rows via the schema.
 * Returns the fileUrl if one existed (caller should delete from R2).
 * Caller must have verified ownership.
 */
export async function deleteItem(itemId: string): Promise<string | null> {
  const item = await prisma.item.delete({
    where: { id: itemId },
    select: { fileUrl: true },
  })
  return item.fileUrl
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

export type SearchItem = {
  id: string
  title: string
  typeIcon: string | null
  typeColor: string | null
  typeName: string
}

export type FavoriteItem = {
  id: string
  title: string
  type: {
    name: string
    icon: string | null
    color: string | null
  }
  updatedAt: Date
}

export async function getFavoriteItems(userId: string): Promise<FavoriteItem[]> {
  const items = await prisma.item.findMany({
    where: { userId, isFavorite: true },
    select: {
      id: true,
      title: true,
      type: { select: { name: true, icon: true, color: true } },
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  return items
}

/**
 * Toggle isFavorite on an item. Returns the new value.
 * Caller must have verified ownership.
 */
export async function toggleItemFavorite(
  userId: string,
  itemId: string,
): Promise<boolean | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { isFavorite: true },
  })
  if (!item) return null

  const updated = await prisma.item.update({
    where: { id: itemId },
    data: { isFavorite: !item.isFavorite },
    select: { isFavorite: true },
  })
  return updated.isFavorite
}

export async function getSearchItems(userId: string): Promise<SearchItem[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      type: { select: { icon: true, color: true, name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    typeIcon: item.type.icon,
    typeColor: item.type.color,
    typeName: item.type.name,
  }))
}
