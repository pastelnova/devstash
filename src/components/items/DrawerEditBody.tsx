'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { capitalize } from '@/lib/utils'
import { CodeEditor } from '@/components/items/CodeEditor'
import { MarkdownEditor } from '@/components/items/MarkdownEditor'
import { LanguageSelect } from '@/components/items/LanguageSelect'
import { Field } from '@/components/items/ItemFormField'
import { updateItem } from '@/actions/items'
import { CollectionSelect, type CollectionOption } from '@/components/items/CollectionSelect'
import { SuggestTagsButton } from '@/components/items/SuggestTagsButton'
import { TypeIconBadge, CONTENT_TYPES, LANGUAGE_TYPES, URL_TYPES } from '@/components/items/drawer-shared'
import type { ItemDetail } from '@/lib/db/items'

type EditState = {
  title: string
  description: string
  content: string
  url: string
  language: string
  tags: string
  collectionIds: string[]
}

function toEditState(item: ItemDetail): EditState {
  return {
    title: item.title,
    description: item.description ?? '',
    content: item.content ?? '',
    url: item.url ?? '',
    language: item.language ?? '',
    tags: item.tags.join(', '),
    collectionIds: item.collections.map((c) => c.id),
  }
}

interface DrawerEditBodyProps {
  item: ItemDetail
  collections: CollectionOption[]
  onCancel: () => void
  onSaved: (updated: ItemDetail) => void
  isPro?: boolean
}

export function DrawerEditBody({ item, collections, onCancel, onSaved, isPro }: DrawerEditBodyProps) {
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
        collectionIds: form.collectionIds,
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

        {showContent && showLanguage && (
          <Field label="Language" htmlFor="item-language">
            <LanguageSelect
              value={form.language}
              onChange={(value) => setForm((f) => ({ ...f, language: value ?? '' }))}
            />
          </Field>
        )}

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

        {showLanguage && !showContent && (
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

        {collections.length > 0 && (
          <Field label="Collections" htmlFor="item-collections">
            <CollectionSelect
              collections={collections}
              selected={form.collectionIds}
              onChange={(ids) => setForm((f) => ({ ...f, collectionIds: ids }))}
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
          <SuggestTagsButton
            title={form.title}
            content={form.content || form.url}
            existingTags={form.tags.split(',').map((t) => t.trim()).filter(Boolean)}
            onAcceptTag={(tag) => {
              setForm((f) => {
                const current = f.tags.trim()
                return { ...f, tags: current ? `${current}, ${tag}` : tag }
              })
            }}
            isPro={!!isPro}
          />
        </Field>
      </div>
    </>
  )
}
