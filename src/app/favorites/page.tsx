import { redirect } from 'next/navigation'
import { Star, FolderOpen } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSystemItemTypes, getSearchItems, getFavoriteItems } from '@/lib/db/items'
import { getSidebarCollections, getSearchCollections, getFavoriteCollections } from '@/lib/db/collections'
import { getEditorPreferences } from '@/lib/db/profile'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { FavoritesList } from '@/components/favorites/FavoritesList'

export default async function FavoritesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')
  const userId = session.user.id

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect('/sign-in')

  const [favoriteItems, favoriteCollections, itemTypes, sidebarCollections, searchItems, searchCollections, editorPreferences] = await Promise.all([
    getFavoriteItems(userId),
    getFavoriteCollections(userId),
    getSystemItemTypes(userId),
    getSidebarCollections(userId),
    getSearchItems(userId),
    getSearchCollections(userId),
    getEditorPreferences(userId),
  ])

  const totalFavorites = favoriteItems.length + favoriteCollections.length

  return (
    <DashboardShell itemTypes={itemTypes} sidebarCollections={sidebarCollections} searchItems={searchItems} searchCollections={searchCollections} user={session.user} editorPreferences={editorPreferences}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            Favorites
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalFavorites} {totalFavorites === 1 ? 'favorite' : 'favorites'}
          </p>
        </div>

        {totalFavorites === 0 ? (
          <div className="rounded-lg border border-dashed bg-card p-12 text-center">
            <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No favorites yet. Star items or collections to see them here.
            </p>
          </div>
        ) : (
          <FavoritesList items={favoriteItems} collections={favoriteCollections} />
        )}
      </div>
    </DashboardShell>
  )
}
