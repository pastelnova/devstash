'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Star, MoreHorizontal, Pencil, Trash2, File } from 'lucide-react'
import { toast } from 'sonner'
import { toggleCollectionFavorite } from '@/actions/collections'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { typeIconMap } from '@/lib/item-type-icons'
import { CollectionEditDialog } from './CollectionEditDialog'
import { CollectionDeleteDialog } from './CollectionDeleteDialog'
import type { CollectionWithMeta } from '@/lib/db/collections'

interface CollectionCardProps {
  collection: CollectionWithMeta
}

export function CollectionCard({ collection: col }: CollectionCardProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(col.isFavorite)
  useEffect(() => setIsFavorite(col.isFavorite), [col.isFavorite])
  const [favPending, startFavTransition] = useTransition()

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => router.push(`/collections/${col.id}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') router.push(`/collections/${col.id}`)
        }}
        className="rounded-lg border border-l-4 bg-card p-4 hover:bg-muted/30 transition-colors cursor-pointer h-full flex flex-col"
        style={{ borderLeftColor: col.dominantColor ?? undefined }}
      >
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-medium text-sm truncate">{col.name}</span>
            {isFavorite && (
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 -mr-1"
              aria-label="Collection actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem
                disabled={favPending}
                onClick={() => {
                  startFavTransition(async () => {
                    const result = await toggleCollectionFavorite(col.id)
                    if (result.success) {
                      setIsFavorite(result.data.isFavorite)
                      router.refresh()
                    } else {
                      toast.error(result.error)
                    }
                  })
                }}
              >
                <Star className={`h-4 w-4 mr-2 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : ''}`} />
                {isFavorite ? 'Unfavorite' : 'Favorite'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-xs text-muted-foreground mb-2">{col.itemCount} {col.itemCount === 1 ? 'item' : 'items'}</p>
        {col.description && (
          <p className="text-xs text-muted-foreground/70 line-clamp-2">{col.description}</p>
        )}
        <div className="flex items-center gap-1.5 mt-auto pt-3">
          {col.typeIcons.map((t) => {
            const Icon = typeIconMap[t.icon] ?? File
            return (
              <Icon
                key={t.icon}
                className="h-3.5 w-3.5"
                style={{ color: t.color || undefined }}
              />
            )
          })}
        </div>
      </div>

      <CollectionEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        collection={col}
      />
      <CollectionDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        collection={col}
      />
    </>
  )
}
