'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
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
import { createCollection, updateCollection } from '@/actions/collections'

interface CollectionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection?: { id: string; name: string; description: string | null } | null
}

export function CollectionFormDialog({ open, onOpenChange, collection }: CollectionFormDialogProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const isEdit = !!collection

  useEffect(() => {
    if (open) {
      setName(collection?.name ?? '')
      setDescription(collection?.description ?? '')
    }
  }, [collection, open])

  function handleOpenChange(next: boolean) {
    if (!next && !isEdit) {
      setName('')
      setDescription('')
    }
    onOpenChange(next)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = isEdit
        ? await updateCollection({
            id: collection!.id,
            name,
            description: description || null,
          })
        : await createCollection({
            name,
            description: description || null,
          })

      if (result.success) {
        toast.success(`Collection "${result.data.name}" ${isEdit ? 'updated' : 'created'}`)
        handleOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const idPrefix = isEdit ? 'edit-collection' : 'collection'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Collection' : 'New Collection'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Update the collection name and description.'
                : 'Create a collection to organize your items.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}-name`}>Name</Label>
              <Input
                id={`${idPrefix}-name`}
                placeholder="e.g. React Patterns"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}-description`}>Description</Label>
              <Input
                id={`${idPrefix}-description`}
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pending ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
