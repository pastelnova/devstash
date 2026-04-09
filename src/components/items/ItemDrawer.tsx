'use client'

import { useEffect, useState } from 'react'
import { Copy, File, Pencil, Pin, Star, Trash2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { typeIconMap } from '@/lib/item-type-icons'
import type { ItemDetail } from '@/lib/db/items'

interface ItemDrawerProps {
  itemId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ItemDrawer({ itemId, open, onOpenChange }: ItemDrawerProps) {
  const [item, setItem] = useState<ItemDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !itemId) return

    let cancelled = false
    setLoading(true)
    setError(null)
    setItem(null)

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col gap-0 p-0">
        {loading && <DrawerSkeleton />}
        {error && !loading && (
          <div className="p-6 text-sm text-destructive">{error}</div>
        )}
        {item && !loading && (
          <DrawerBody item={item} onCopy={handleCopy} />
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

function DrawerBody({ item, onCopy }: { item: ItemDetail; onCopy: () => void }) {
  const Icon = item.type.icon ? (typeIconMap[item.type.icon] ?? File) : File
  const iconColor = item.type.color ?? '#94a3b8'

  const date = new Date(item.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <>
      <SheetHeader className="px-6 pt-6 pb-4 border-b">
        <div className="flex items-start gap-3">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${iconColor}22` }}
          >
            <Icon className="h-5 w-5" style={{ color: iconColor }} />
          </div>
          <div className="flex-1 min-w-0 pr-8">
            <SheetTitle className="text-base font-semibold truncate">{item.title}</SheetTitle>
            {item.description && (
              <SheetDescription className="mt-1 line-clamp-2">{item.description}</SheetDescription>
            )}
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-1 mt-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            aria-label={item.isFavorite ? 'Unfavorite' : 'Favorite'}
          >
            <Star
              className={
                item.isFavorite
                  ? 'h-4 w-4 fill-yellow-400 text-yellow-400'
                  : 'h-4 w-4'
              }
            />
            <span className="text-xs">Favorite</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            aria-label={item.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className={item.isPinned ? 'h-4 w-4 fill-current' : 'h-4 w-4'} />
            <span className="text-xs">Pin</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={onCopy} aria-label="Copy">
            <Copy className="h-4 w-4" />
            <span className="text-xs">Copy</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5" aria-label="Edit">
            <Pencil className="h-4 w-4" />
            <span className="text-xs">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto gap-1.5 text-destructive hover:text-destructive"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </SheetHeader>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Meta */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <MetaRow label="Type" value={capitalize(item.type.name)} />
          <MetaRow label="Created" value={date} />
          {item.collection && <MetaRow label="Collection" value={item.collection.name} />}
          {item.language && <MetaRow label="Language" value={item.language} />}
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Tags</p>
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {item.content && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Content</p>
            <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto whitespace-pre-wrap font-mono">
              {item.content}
            </pre>
          </div>
        )}

        {/* URL */}
        {item.url && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">URL</p>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline break-all"
            >
              {item.url}
            </a>
          </div>
        )}
      </div>
    </>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
