'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { File } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { typeIconMap } from '@/lib/item-type-icons'
import { Field } from '@/components/items/ItemFormField'
import { CodeEditor } from '@/components/items/CodeEditor'
import { MarkdownEditor } from '@/components/items/MarkdownEditor'
import { LanguageSelect } from '@/components/items/LanguageSelect'
import { FileUpload } from '@/components/items/FileUpload'
import { createItem, createFileItem, type CreateItemInput, type CreateFileItemInput } from '@/actions/items'
import { CollectionSelect, type CollectionOption } from '@/components/items/CollectionSelect'
import { SuggestTagsButton } from '@/components/items/SuggestTagsButton'
import { GenerateDescriptionButton } from '@/components/items/GenerateDescriptionButton'
import type { SystemItemType } from '@/lib/db/items'

const CREATABLE_TYPES = ['snippet', 'prompt', 'command', 'note', 'link', 'file', 'image'] as const
export type CreatableType = (typeof CREATABLE_TYPES)[number]

const CONTENT_TYPES = new Set<CreatableType>(['snippet', 'prompt', 'command', 'note'])
const LANGUAGE_TYPES = new Set<CreatableType>(['snippet', 'command'])
const URL_TYPES = new Set<CreatableType>(['link'])
const FILE_TYPES = new Set<CreatableType>(['file', 'image'])

interface ItemCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemTypes: SystemItemType[]
  collections: CollectionOption[]
  defaultType?: CreatableType
  isPro?: boolean
}

type UploadedFile = {
  key: string
  fileName: string
  fileSize: number
  contentType: string
}

type FormState = {
  type: CreatableType
  title: string
  description: string
  content: string
  url: string
  language: string
  tags: string
  collectionIds: string[]
  uploadedFile: UploadedFile | null
}

const INITIAL_FORM: FormState = {
  type: 'snippet',
  title: '',
  description: '',
  content: '',
  url: '',
  language: '',
  tags: '',
  collectionIds: [],
  uploadedFile: null,
}

export function ItemCreateDialog({ open, onOpenChange, itemTypes, collections, defaultType, isPro }: ItemCreateDialogProps) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(() =>
    defaultType ? { ...INITIAL_FORM, type: defaultType } : INITIAL_FORM,
  )
  const [pending, startTransition] = useTransition()

  // Build selector entries keyed off the system item types actually in the DB,
  // filtered to the 5 types we allow creating.
  const typeOptions = CREATABLE_TYPES.map((name) => {
    const meta = itemTypes.find((t) => t.name.toLowerCase() === name)
    return {
      name,
      icon: meta?.icon ?? null,
      color: meta?.color ?? null,
    }
  })

  const showContent = CONTENT_TYPES.has(form.type)
  const showLanguage = LANGUAGE_TYPES.has(form.type)
  const showUrl = URL_TYPES.has(form.type)
  const showFile = FILE_TYPES.has(form.type)

  const titleTrimmed = form.title.trim()
  const urlTrimmed = form.url.trim()
  const canSave =
    titleTrimmed.length > 0 &&
    (!showUrl || urlTrimmed.length > 0) &&
    (!showFile || form.uploadedFile !== null) &&
    !pending

  const initialForm = defaultType ? { ...INITIAL_FORM, type: defaultType } : INITIAL_FORM

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setForm(initialForm)
    }
    onOpenChange(next)
  }

  const handleSubmit = () => {
    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    startTransition(async () => {
      let result

      if (showFile && form.uploadedFile) {
        const input: CreateFileItemInput = {
          type: form.type as 'file' | 'image',
          title: form.title,
          description: form.description,
          tags,
          collectionIds: form.collectionIds,
          fileUrl: form.uploadedFile.key,
          fileName: form.uploadedFile.fileName,
          fileSize: form.uploadedFile.fileSize,
        }
        result = await createFileItem(input)
      } else {
        const input: CreateItemInput = {
          type: form.type as 'snippet' | 'prompt' | 'command' | 'note' | 'link',
          title: form.title,
          description: form.description,
          content: showContent ? form.content : null,
          url: showUrl ? form.url : null,
          language: showLanguage ? form.language : null,
          tags,
          collectionIds: form.collectionIds,
        }
        result = await createItem(input)
      }

      if (result.success) {
        toast.success('Item created')
        setForm(initialForm)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
          <DialogDescription>Add a snippet, prompt, command, note, link, file, or image.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Type</Label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {typeOptions.map((opt) => {
                const Icon = opt.icon ? (typeIconMap[opt.icon] ?? File) : File
                const active = form.type === opt.name
                const color = opt.color ?? '#94a3b8'
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: opt.name }))}
                    className={`flex flex-col items-center gap-1 rounded-md border p-2 text-xs transition-colors ${
                      active
                        ? 'border-ring bg-muted'
                        : 'border-input hover:bg-muted/50'
                    }`}
                    aria-pressed={active}
                  >
                    <Icon className="h-4 w-4" style={{ color }} />
                    <span className="capitalize">{opt.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <Field label="Title" htmlFor="create-title">
            <Input
              id="create-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Give it a name"
              aria-invalid={titleTrimmed.length === 0}
            />
          </Field>

          <Field label="Description" htmlFor="create-description">
            <textarea
              id="create-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
            <GenerateDescriptionButton
              title={form.title}
              type={form.type}
              content={form.content}
              url={form.url}
              tags={form.tags.split(',').map((t) => t.trim()).filter(Boolean)}
              language={form.language}
              onGenerated={(desc) => setForm((f) => ({ ...f, description: desc }))}
              isPro={!!isPro}
            />
          </Field>

          {showContent && showLanguage && (
            <Field label="Language" htmlFor="create-language">
              <LanguageSelect
                value={form.language}
                onChange={(value) => setForm((f) => ({ ...f, language: value ?? '' }))}
              />
            </Field>
          )}

          {showContent && (
            <Field label="Content" htmlFor="create-content">
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
            <Field label="Language" htmlFor="create-language">
              <Input
                id="create-language"
                value={form.language}
                onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
                placeholder="e.g. typescript"
              />
            </Field>
          )}

          {showUrl && (
            <Field label="URL" htmlFor="create-url">
              <Input
                id="create-url"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://…"
                aria-invalid={urlTrimmed.length === 0}
              />
            </Field>
          )}

          {showFile && (
            <Field label={form.type === 'image' ? 'Image' : 'File'} htmlFor="create-file">
              <FileUpload
                type={form.type as 'file' | 'image'}
                uploaded={form.uploadedFile}
                onUploaded={(result) =>
                  setForm((f) => ({ ...f, uploadedFile: result }))
                }
                onRemove={() =>
                  setForm((f) => ({ ...f, uploadedFile: null }))
                }
              />
            </Field>
          )}

          {collections.length > 0 && (
            <Field label="Collections" htmlFor="create-collections">
              <CollectionSelect
                collections={collections}
                selected={form.collectionIds}
                onChange={(ids) => setForm((f) => ({ ...f, collectionIds: ids }))}
              />
            </Field>
          )}

          <Field label="Tags" htmlFor="create-tags" hint="Comma-separated">
            <Input
              id="create-tags"
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

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSave}>
            {pending ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

