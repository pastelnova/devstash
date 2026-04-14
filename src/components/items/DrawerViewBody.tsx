'use client'

import { useState } from 'react'
import { Copy, Download, FileIcon, Pencil, Pin, Star, Trash2 } from 'lucide-react'
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { capitalize, formatFileSize } from '@/lib/utils'
import { CodeEditor } from '@/components/items/CodeEditor'
import { MarkdownEditor } from '@/components/items/MarkdownEditor'
import { TypeIconBadge, MetaRow, LANGUAGE_TYPES, FILE_VIEW_TYPES } from '@/components/items/drawer-shared'
import type { ItemDetail } from '@/lib/db/items'

interface DrawerViewBodyProps {
  item: ItemDetail
  onCopy: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleFavorite: () => void
  deletePending: boolean
  favoritePending: boolean
}

export function DrawerViewBody({
  item,
  onCopy,
  onEdit,
  onDelete,
  onToggleFavorite,
  deletePending,
  favoritePending,
}: DrawerViewBodyProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const date = new Date(item.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <>
      <SheetHeader className="px-6 pt-6 pb-4 border-b">
        <div className="flex items-start gap-3">
          <TypeIconBadge item={item} />
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
            onClick={onToggleFavorite}
            disabled={favoritePending}
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
          {FILE_VIEW_TYPES.has(item.type.name.toLowerCase()) && item.fileUrl && (
            <a
              href={`/api/download/${item.id}`}
              download
              aria-label="Download"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="text-xs">Download</span>
            </a>
          )}
          {!FILE_VIEW_TYPES.has(item.type.name.toLowerCase()) && (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={onCopy} aria-label="Copy">
              <Copy className="h-4 w-4" />
              <span className="text-xs">Copy</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={onEdit}
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
            <span className="text-xs">Edit</span>
          </Button>
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto gap-1.5 text-destructive hover:text-destructive"
                  aria-label="Delete"
                  disabled={deletePending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete <strong>{item.title}</strong>. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    setConfirmOpen(false)
                    onDelete()
                  }}
                  disabled={deletePending}
                >
                  {deletePending ? 'Deleting…' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetHeader>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Meta */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <MetaRow label="Type" value={capitalize(item.type.name)} />
          <MetaRow label="Created" value={date} />
          {item.collections.length > 0 && (
            <MetaRow label={item.collections.length === 1 ? 'Collection' : 'Collections'} value={item.collections.map((c) => c.name).join(', ')} />
          )}
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

        {/* Image preview */}
        {item.type.name.toLowerCase() === 'image' && item.fileUrl && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/download/${item.id}`}
              alt={item.title}
              className="max-w-full max-h-80 rounded-lg border border-border object-contain"
            />
          </div>
        )}

        {/* File info */}
        {item.type.name.toLowerCase() === 'file' && item.fileUrl && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">File</p>
            <div className="flex items-center gap-3 rounded-lg border border-input bg-muted/30 p-3">
              <FileIcon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.fileName}</p>
                {item.fileSize && (
                  <p className="text-xs text-muted-foreground">{formatFileSize(item.fileSize)}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {item.content && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Content</p>
            {LANGUAGE_TYPES.has(item.type.name.toLowerCase()) ? (
              <CodeEditor
                value={item.content}
                language={item.language ?? undefined}
                readOnly
              />
            ) : (
              <MarkdownEditor value={item.content} readOnly />
            )}
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
