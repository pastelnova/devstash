import { prisma } from "@/lib/prisma"

export const FREE_PLAN_ITEM_LIMIT = 50
export const FREE_PLAN_COLLECTION_LIMIT = 3

export async function canCreateItem(userId: string, isPro: boolean) {
  if (isPro) return true

  const count = await prisma.item.count({ where: { userId } })
  return count < FREE_PLAN_ITEM_LIMIT
}

export async function canCreateCollection(userId: string, isPro: boolean) {
  if (isPro) return true

  const count = await prisma.collection.count({ where: { userId } })
  return count < FREE_PLAN_COLLECTION_LIMIT
}

export async function getUserLimits(userId: string, isPro: boolean) {
  if (isPro) {
    return {
      items: { current: await prisma.item.count({ where: { userId } }), limit: null },
      collections: { current: await prisma.collection.count({ where: { userId } }), limit: null },
    }
  }

  const [itemCount, collectionCount] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
  ])

  return {
    items: { current: itemCount, limit: FREE_PLAN_ITEM_LIMIT },
    collections: { current: collectionCount, limit: FREE_PLAN_COLLECTION_LIMIT },
  }
}
