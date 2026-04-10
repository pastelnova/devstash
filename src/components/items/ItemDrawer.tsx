'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Copy, Download, File, FileIcon, Pencil, Pin, Star, Trash2, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { typeIconMap } from '@/lib/item-type-icons'
import { capitalize, formatFileSize } from '@/lib/utils'
import { CodeEditor } from '@/components/items/CodeEditor'
import { MarkdownEditor } from '@/components/items/MarkdownEditor'
import { Field } from '@/components/items/ItemFormField'
import { deleteItem, updateItem } from '@/actions/items'
import type { ItemDetail } from '@/lib/db/items'

interface ItemDrawerProps {
  itemId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type EditState = {
  title: string
  description: string
  content: string
  url: string
  language: string
  tags: string
}

function toEditState(item: ItemDetail): EditState {
  return {
    title: item.title,
    description: item.description ?? '',
    content: item.content ?? '',
    url: item.url ?? '',
    language: item.language ?? '',
    tags: item.tags.join(', '),
  }
}

const CONTENT_TYPES = new Set(['snippet', 'prompt', 'command', 'note'])
const LANGUAGE_TYPES = new Set(['snippet', 'command'])
const URL_TYPES = new Set(['link'])
const FILE_VIEW_TYPES = new Set(['file', 'image'])

export function ItemDrawer({ itemId, open, onOpenChange }: ItemDrawerProps) {
  const router = useRouter()
  const [item, setItem] = useState<ItemDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [deletePending, startDeleteTransition] = useTransition()

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
            deletePending={deletePending}
          />
        )}
        {item && !loading && editing && (
          <DrawerEditBody
            item={item}
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

function TypeIconBadge({ item }: { item: ItemDetail }) {
  const Icon = item.type.icon ? (typeIconMap[item.type.icon] ?? File) : File
  const iconColor = item.type.color ?? '#94a3b8'
  return (
    <div
      className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
      style={{ backgroundColor: `${iconColor}22` }}
    >
      <Icon className="h-5 w-5" style={{ color: iconColor }} />
    </div>
  )
}

function DrawerViewBody({
  item,
  onCopy,
  onEdit,
  onDelete,
  deletePending,
}: {
  item: ItemDetail
  onCopy: () => void
  onEdit: () => void
  onDelete: () => void
  deletePending: boolean
}) {
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

function DrawerEditBody({
  item,
  onCancel,
  onSaved,
}: {
  item: ItemDetail
  onCancel: () => void
  onSaved: (updated: ItemDetail) => void
}) {
  const router = useRouter()
  const [form, setForm] = useState<EditState>(() => toEditState(item))
  const [pending, startTransition] = useTransition()

  const typeName = item.type.name.toLowerCase()
  const showContent = CONTENT_TYPES.has(typeName)
  const showLanguage = LANGUAGE_TYPES.has(typeName)
  const showUrl = URL_TYPES.has(typeName)

  const titleTrimmed = form.title.trim()
  const canSave = titleTrimmed.length > 0 && !pending

  const handleSave = () => {
    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    startTransition(async () => {
      const result = await updateItem(item.id, {
        title: form.title,
        description: form.description,
        content: showContent ? form.content : null,
        url: showUrl ? form.url : null,
        language: showLanguage ? form.language : null,
        tags,
      })

      if (result.success) {
        toast.success('Item updated')
        router.refresh()
        onSaved(result.data)
      } else {
        toast.error(result.error)
      }
    })
  }

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
            <SheetTitle className="text-base font-semibold">Edit item</SheetTitle>
            <SheetDescription className="mt-1">
              {capitalize(item.type.name)} · {date}
            </SheetDescription>
          </div>
        </div>

        {/* Action bar — Save / Cancel */}
        <div className="flex items-center gap-2 mt-4">
          <Button size="sm" onClick={handleSave} disabled={!canSave}>
            {pending ? 'Saving…' : 'Save'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={pending}
            className="gap-1.5"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </SheetHeader>

      {/* Body — form */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <Field label="Title" htmlFor="item-title">
          <Input
            id="item-title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            aria-invalid={titleTrimmed.length === 0}
          />
        </Field>

        <Field label="Description" htmlFor="item-description">
          <textarea
            id="item-description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
        </Field>

        {showContent && (
          <Field label="Content" htmlFor="item-content">
            {showLanguage ? (
              <CodeEditor
                value={form.content}
                language={form.language || undefined}
                onChange={(val) => setForm((f) => ({ ...f, content: val }))}
              />
            ) : (
              <MarkdownEditor
                value={form.content}
                onChange={(val) => setForm((f) => ({ ...f, content: val }))}
              />
            )}
          </Field>
        )}

        {showLanguage && (
          <Field label="Language" htmlFor="item-language">
            <Input
              id="item-language"
              value={form.language}
              onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
              placeholder="e.g. typescript"
            />
          </Field>
        )}

        {showUrl && (
          <Field label="URL" htmlFor="item-url">
            <Input
              id="item-url"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://…"
            />
          </Field>
        )}

        <Field
          label="Tags"
          htmlFor="item-tags"
          hint="Comma-separated"
        >
          <Input
            id="item-tags"
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            placeholder="react, hooks, ui"
          />
        </Field>
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

