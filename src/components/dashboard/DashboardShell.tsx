'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, FolderPlus, Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import type { SystemItemType } from '@/lib/db/items'
import type { SidebarCollection } from '@/lib/db/collections'

interface DashboardShellProps {
  children: React.ReactNode
  itemTypes: SystemItemType[]
  sidebarCollections: SidebarCollection[]
}

export function DashboardShell({ children, itemTypes, sidebarCollections }: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Top Bar */}
      <header className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
        {/* Mobile hamburger */}
        <button
          className="md:hidden p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
            S
          </div>
          <span className="font-semibold text-sm">DevStash</span>
        </div>
        {/* Mobile logo */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
            S
          </div>
          <span className="font-semibold text-sm">DevStash</span>
        </div>

        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              className="pl-8 bg-muted border-0 h-8 text-sm"
              readOnly
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <FolderPlus className="h-4 w-4" />
            <span className="hidden sm:inline">New Collection</span>
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Item</span>
          </Button>
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
        />

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
