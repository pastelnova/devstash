import { prisma } from '@/lib/prisma'
import { type EditorPreferences, EDITOR_DEFAULTS } from '@/types/editor-preferences'

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

export async function getEditorPreferences(userId: string): Promise<EditorPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { editorPreferences: true },
  })
  return { ...EDITOR_DEFAULTS, ...(user?.editorPreferences as Partial<EditorPreferences> | null) }
}

export async function updateEditorPreferences(
  userId: string,
  preferences: EditorPreferences,
): Promise<EditorPreferences> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { editorPreferences: JSON.parse(JSON.stringify(preferences)) },
    select: { editorPreferences: true },
  })
  return { ...EDITOR_DEFAULTS, ...(user.editorPreferences as Partial<EditorPreferences> | null) }
}
