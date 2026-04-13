'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import { useItemDrawer } from '@/components/items/ItemDrawerContext'
import { typeIconMap } from '@/lib/item-type-icons'
import { FolderOpen } from 'lucide-react'
import type { SearchItem } from '@/lib/db/items'
import type { SearchCollection } from '@/lib/db/collections'

interface CommandPaletteProps {
  items: SearchItem[]
  collections: SearchCollection[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ items, collections, open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const { openItem } = useItemDrawer()

  const handleSelectItem = useCallback((itemId: string) => {
    onOpenChange(false)
    openItem(itemId)
  }, [onOpenChange, openItem])

  const handleSelectCollection = useCallback((collectionId: string) => {
    onOpenChange(false)
    router.push(`/collections/${collectionId}`)
  }, [onOpenChange, router])

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search across items and collections"
    >
      <Command filter={(value, search) => {
        const v = value.toLowerCase()
        const words = search.toLowerCase().split(/\s+/).filter(Boolean)
        return words.every((w) => v.includes(w)) ? 1 : 0
      }}>
        <CommandInput placeholder="Search items and collections..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {items.length > 0 && (
            <CommandGroup heading="Items">
              {items.map((item) => {
                const Icon = item.typeIcon ? typeIconMap[item.typeIcon] : null
                return (
                  <CommandItem
                    key={item.id}
                    value={`${item.title} ${item.typeName}`}
                    onSelect={() => handleSelectItem(item.id)}
                  >
                    {Icon && (
                      <div
                        className="flex h-5 w-5 items-center justify-center rounded"
                        style={{ color: item.typeColor ?? undefined }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <span className="truncate">{item.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{item.typeName}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}

          {items.length > 0 && collections.length > 0 && <CommandSeparator />}

          {collections.length > 0 && (
            <CommandGroup heading="Collections">
              {collections.map((collection) => (
                <CommandItem
                  key={collection.id}
                  value={collection.name}
                  onSelect={() => handleSelectCollection(collection.id)}
                >
                  <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{collection.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {collection.itemCount} {collection.itemCount === 1 ? 'item' : 'items'}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
