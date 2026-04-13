'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Search, Plus, FolderPlus, Menu } from 'lucide-react'
import { Sidebar, type SidebarUser } from './Sidebar'
import type { SystemItemType, SearchItem } from '@/lib/db/items'
import type { SidebarCollection, SearchCollection } from '@/lib/db/collections'
import { ItemDrawerProvider } from '@/components/items/ItemDrawerContext'
import { ItemCreateDialog, type CreatableType } from '@/components/items/ItemCreateDialog'
import { CollectionCreateDialog } from '@/components/dashboard/CollectionCreateDialog'
import { CommandPalette } from '@/components/dashboard/CommandPalette'
import { EditorPreferencesProvider } from '@/components/settings/EditorPreferencesContext'
import type { EditorPreferences } from '@/types/editor-preferences'

const CreateDialogContext = createContext<(() => void) | null>(null)

export function useOpenCreateDialog() {
  const open = useContext(CreateDialogContext)
  if (!open) throw new Error('useOpenCreateDialog must be used within DashboardShell')
  return open
}

interface DashboardShellProps {
  children: React.ReactNode
  itemTypes: SystemItemType[]
  sidebarCollections: SidebarCollection[]
  searchItems: SearchItem[]
  searchCollections: SearchCollection[]
  user?: SidebarUser | null
  defaultCreateType?: CreatableType
  editorPreferences?: EditorPreferences | null
}

export function DashboardShell({ children, itemTypes, sidebarCollections, searchItems, searchCollections, user, defaultCreateType, editorPreferences }: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [collectionCreateOpen, setCollectionCreateOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <EditorPreferencesProvider initial={editorPreferences}>
    <ItemDrawerProvider collections={sidebarCollections}>
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Top Bar */}
      <header className="flex items-center h-14 border-b border-border shrink-0">
        {/* Logo area — matches sidebar width on desktop */}
        <div className="flex items-center gap-3 px-4 md:w-60 shrink-0">
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              S
            </div>
            <span className="font-semibold text-sm">DevStash</span>
          </Link>
        </div>

        {/* Main area — aligns with dashboard content */}
        <div className="flex-1 flex items-center gap-3 px-6 min-w-0">
          <button
            className="relative flex-1 max-w-md flex items-center gap-2 h-8 rounded-md bg-muted px-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            onClick={() => setCommandOpen(true)}
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Search items...</span>
            <kbd className="pointer-events-none hidden sm:inline-flex h-5 items-center rounded bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground border border-border">
              ⌘K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setCollectionCreateOpen(true)}>
            <FolderPlus className="h-4 w-4" />
            <span className="hidden sm:inline">New Collection</span>
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Item</span>
          </Button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          itemTypes={itemTypes}
          sidebarCollections={sidebarCollections}
          user={user}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <CreateDialogContext.Provider value={() => setCreateOpen(true)}>
            {children}
          </CreateDialogContext.Provider>
        </main>
      </div>

      <ItemCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        itemTypes={itemTypes}
        collections={sidebarCollections}
        defaultType={defaultCreateType}
      />
      <CollectionCreateDialog
        open={collectionCreateOpen}
        onOpenChange={setCollectionCreateOpen}
      />
      <CommandPalette
        items={searchItems}
        collections={searchCollections}
        open={commandOpen}
        onOpenChange={setCommandOpen}
      />
    </div>
    </ItemDrawerProvider>
    </EditorPreferencesProvider>
  )
}
