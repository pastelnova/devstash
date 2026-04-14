'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { DrawerViewBody } from '@/components/items/DrawerViewBody'
import { DrawerEditBody } from '@/components/items/DrawerEditBody'
import { deleteItem, toggleItemFavorite, toggleItemPin } from '@/actions/items'
import type { CollectionOption } from '@/components/items/CollectionSelect'
import type { ItemDetail } from '@/lib/db/items'

interface ItemDrawerProps {
  itemId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  collections: CollectionOption[]
}

export function ItemDrawer({ itemId, open, onOpenChange, collections }: ItemDrawerProps) {
  const router = useRouter()
  const [item, setItem] = useState<ItemDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [deletePending, startDeleteTransition] = useTransition()
  const [favoritePending, startFavoriteTransition] = useTransition()
  const [pinPending, startPinTransition] = useTransition()

  useEffect(() => {
    if (!open || !itemId) return

    let cancelled = false
    setLoading(true)
    setError(null)
    setItem(null)
    setEditing(false)

    fetch(`/api/items/${itemId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Item not found' : 'Failed to load item')
        return res.json() as Promise<ItemDetail>
      })
      .then((data) => {
        if (!cancelled) setItem(data)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, itemId])

  const handleCopy = async () => {
    if (!item) return
    const text = item.content ?? item.url ?? item.title
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // no-op
    }
  }

  const handleToggleFavorite = () => {
    if (!item) return
    startFavoriteTransition(async () => {
      const result = await toggleItemFavorite(item.id)
      if (result.success) {
        setItem({ ...item, isFavorite: result.data.isFavorite })
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleTogglePin = () => {
    if (!item) return
    startPinTransition(async () => {
      const result = await toggleItemPin(item.id)
      if (result.success) {
        setItem({ ...item, isPinned: result.data.isPinned })
        toast.success(result.data.isPinned ? 'Item pinned' : 'Item unpinned')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleDelete = () => {
    if (!item) return
    startDeleteTransition(async () => {
      const result = await deleteItem(item.id)
      if (result.success) {
        toast.success('Item deleted')
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col gap-0 p-0">
        {loading && <DrawerSkeleton />}
        {error && !loading && (
          <div className="p-6 text-sm text-destructive">{error}</div>
        )}
        {item && !loading && !editing && (
          <DrawerViewBody
            item={item}
            onCopy={handleCopy}
            onEdit={() => setEditing(true)}
            onDelete={handleDelete}
            onToggleFavorite={handleToggleFavorite}
            onTogglePin={handleTogglePin}
            deletePending={deletePending}
            favoritePending={favoritePending}
            pinPending={pinPending}
          />
        )}
        {item && !loading && editing && (
          <DrawerEditBody
            item={item}
            collections={collections}
            onCancel={() => setEditing(false)}
            onSaved={(updated) => {
              setItem(updated)
              setEditing(false)
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function DrawerSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 bg-muted rounded" />
          <div className="h-3 w-1/3 bg-muted rounded" />
        </div>
      </div>
      <div className="h-10 w-full bg-muted rounded" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-5/6 bg-muted rounded" />
        <div className="h-3 w-4/6 bg-muted rounded" />
      </div>
    </div>
  )
}
