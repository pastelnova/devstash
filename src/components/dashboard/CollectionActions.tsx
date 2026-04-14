'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { toggleCollectionFavorite } from '@/actions/collections'
import { CollectionEditDialog } from './CollectionEditDialog'
import { CollectionDeleteDialog } from './CollectionDeleteDialog'

interface CollectionActionsProps {
  collection: { id: string; name: string; description: string | null; isFavorite: boolean }
  redirectOnDelete?: string
}

export function CollectionActions({ collection, redirectOnDelete }: CollectionActionsProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(collection.isFavorite)
  useEffect(() => setIsFavorite(collection.isFavorite), [collection.isFavorite])
  const [favPending, startFavTransition] = useTransition()

  const handleToggleFavorite = () => {
    startFavTransition(async () => {
      const result = await toggleCollectionFavorite(collection.id)
      if (result.success) {
        setIsFavorite(result.data.isFavorite)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleToggleFavorite}
          disabled={favPending}
          title={isFavorite ? 'Unfavorite' : 'Favorite'}
        >
          <Star
            className={`h-4 w-4 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setEditOpen(true)}
          title="Edit collection"
        >
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setDeleteOpen(true)}
          title="Delete collection"
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <CollectionEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        collection={collection}
      />
      <CollectionDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        collection={collection}
        redirectTo={redirectOnDelete}
      />
    </>
  )
}
