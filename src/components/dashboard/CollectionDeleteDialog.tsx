'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteCollection } from '@/actions/collections'

interface CollectionDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection: { id: string; name: string } | null
  redirectTo?: string
}

export function CollectionDeleteDialog({
  open,
  onOpenChange,
  collection,
  redirectTo,
}: CollectionDeleteDialogProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    if (!collection) return
    startTransition(async () => {
      const result = await deleteCollection(collection.id)
      if (result.success) {
        toast.success(`Collection "${collection.name}" deleted`)
        onOpenChange(false)
        if (redirectTo) {
          router.push(redirectTo)
        } else {
          router.refresh()
        }
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete collection?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete &ldquo;{collection?.name}&rdquo;. Items in this
            collection will not be deleted — they will remain in your library.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={pending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {pending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
