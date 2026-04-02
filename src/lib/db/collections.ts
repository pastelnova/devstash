import { prisma } from '@/lib/prisma'

export type CollectionWithMeta = {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
  itemCount: number
  typeIcons: string[]
  dominantColor: string | null
}

export async function getCollections(userId: string): Promise<CollectionWithMeta[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          type: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
  })

  return collections.map((col) => {
    // Count usage per type to find the dominant one (for border color)
    const typeCounts: Record<string, { count: number; icon: string; color: string }> = {}
    for (const item of col.items) {
      const { id, icon, color } = item.type
      if (!typeCounts[id]) {
        typeCounts[id] = { count: 0, icon: icon ?? '', color: color ?? '' }
      }
      typeCounts[id].count++
    }

    const typeEntries = Object.values(typeCounts)
    const sorted = typeEntries.sort((a, b) => b.count - a.count)
    const dominantColor = sorted[0]?.color ?? null
    const typeIcons = sorted.map((t) => t.icon).filter(Boolean)

    return {
      id: col.id,
      name: col.name,
      description: col.description,
      isFavorite: col.isFavorite,
      itemCount: col.items.length,
      typeIcons,
      dominantColor,
    }
  })
}
