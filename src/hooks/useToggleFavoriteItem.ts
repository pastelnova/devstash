'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { toggleItemFavorite } from '@/actions/items'

export function useToggleFavoriteItem(itemId: string, initialFavorite: boolean) {
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(initialFavorite)
  useEffect(() => setIsFavorite(initialFavorite), [initialFavorite])
  const [favPending, startFavTransition] = useTransition()

  const handleToggleFavorite = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    startFavTransition(async () => {
      const result = await toggleItemFavorite(itemId)
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
