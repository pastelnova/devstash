'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { ItemDrawer } from './ItemDrawer'

type ItemDrawerContextValue = {
  openItem: (id: string) => void
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null)

export function useItemDrawer() {
  const ctx = useContext(ItemDrawerContext)
  if (!ctx) throw new Error('useItemDrawer must be used within ItemDrawerProvider')
  return ctx
}

export function ItemDrawerProvider({ children }: { children: React.ReactNode }) {
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
      <ItemDrawer itemId={itemId} open={open} onOpenChange={handleOpenChange} />
    </ItemDrawerContext.Provider>
  )
}
