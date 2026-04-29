'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { ItemDrawer } from './ItemDrawer'
import type { CollectionOption } from './CollectionSelect'

type ItemDrawerContextValue = {
  openItem: (id: string) => void
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null)

export function useItemDrawer() {
  const ctx = useContext(ItemDrawerContext)
  if (!ctx) throw new Error('useItemDrawer must be used within ItemDrawerProvider')
  return ctx
}

interface ItemDrawerProviderProps {
  children: React.ReactNode
  collections: CollectionOption[]
  isPro?: boolean
}

export function ItemDrawerProvider({ children, collections, isPro }: ItemDrawerProviderProps) {
  const [itemId, setItemId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const openItem = useCallback((id: string) => {
    setItemId(id)
    setOpen(true)
  }, [])

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next)
    if (!next) {
      // Clear id after close animation
      setTimeout(() => setItemId(null), 200)
    }
  }, [])

  return (
    <ItemDrawerContext.Provider value={{ openItem }}>
      {children}
      <ItemDrawer itemId={itemId} open={open} onOpenChange={handleOpenChange} collections={collections} isPro={isPro} />
    </ItemDrawerContext.Provider>
  )
}
