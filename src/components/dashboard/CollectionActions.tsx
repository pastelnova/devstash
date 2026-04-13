'use client'

import { useState } from 'react'
import { Pencil, Trash2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CollectionEditDialog } from './CollectionEditDialog'
import { CollectionDeleteDialog } from './CollectionDeleteDialog'

interface CollectionActionsProps {
  collection: { id: string; name: string; description: string | null; isFavorite: boolean }
  redirectOnDelete?: string
}

export function CollectionActions({ collection, redirectOnDelete }: CollectionActionsProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(collection.isFavorite)

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsFavorite(!isFavorite)}
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
