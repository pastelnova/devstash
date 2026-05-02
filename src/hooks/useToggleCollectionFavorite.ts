'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { toggleCollectionFavorite } from '@/actions/collections'

export function useToggleCollectionFavorite(collectionId: string, initialFavorite: boolean) {
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(initialFavorite)
  useEffect(() => setIsFavorite(initialFavorite), [initialFavorite])
  const [favPending, startFavTransition] = useTransition()

  const handleToggleFavorite = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    startFavTransition(async () => {
      const result = await toggleCollectionFavorite(collectionId)
      if (result.success) {
        setIsFavorite(result.data.isFavorite)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return { isFavorite, favPending, handleToggleFavorite }
}
