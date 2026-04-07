import { prisma } from '@/lib/prisma'

export type ProfileStats = {
  totalItems: number
  totalCollections: number
  itemsByType: { name: string; icon: string | null; color: string | null; count: number }[]
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const [totalItems, totalCollections, types] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    prisma.itemType.findMany({
      where: { isSystem: true },
      include: {
        _count: { select: { items: { where: { userId } } } },
      },
    }),
  ])

  return {
    totalItems,
    totalCollections,
    itemsByType: types
      .map((t) => ({
        name: t.name,
        icon: t.icon,
        color: t.color,
        count: t._count.items,
      }))
      .filter((t) => t.count > 0)
      .sort((a, b) => b.count - a.count),
  }
}

export async function hasPassword(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  })
  return !!user?.password
}
