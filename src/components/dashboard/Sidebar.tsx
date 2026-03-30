'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Code2,
  Sparkles,
  Terminal,
  FileText,
  File,
  Image,
  Link as LinkIcon,
  Star,
  ChevronRight,
  PanelLeft,
  Settings,
  X,
} from 'lucide-react'
import { mockUser, mockItemTypes, mockCollections } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const typeIconMap: Record<string, React.ElementType> = {
  code: Code2,
  sparkles: Sparkles,
  terminal: Terminal,
  'file-text': FileText,
  file: File,
  image: Image,
  link: LinkIcon,
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const [typesExpanded, setTypesExpanded] = useState(true)
  const [collectionsExpanded, setCollectionsExpanded] = useState(true)

  const favoriteCollections = mockCollections.filter((c) => c.isFavorite)
  const recentCollections = mockCollections.filter((c) => !c.isFavorite)

  const renderContent = (isMobileDrawer: boolean) => (
    <div className="flex flex-col h-full">
      {/* Sidebar toggle row */}
      <div
        className={cn(
          'flex items-center h-12 px-3 border-b border-border shrink-0',
          !isMobileDrawer && collapsed ? 'justify-center' : 'justify-end'
        )}
      >
        {isMobileDrawer ? (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4">
        {/* Types */}
        <div className="px-2">
          {!collapsed && (
            <button
              onClick={() => setTypesExpanded(!typesExpanded)}
              className="flex items-center justify-between w-full px-2 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
            >
              <span>Types</span>
              <ChevronRight
                className={cn('h-3 w-3 transition-transform', typesExpanded && 'rotate-90')}
              />
            </button>
          )}
          {(typesExpanded || collapsed) && (
            <ul className="space-y-0.5">
              {mockItemTypes.map((type) => {
                const Icon = typeIconMap[type.icon] ?? File
                const slug = type.name.toLowerCase()
                return (
                  <li key={type.id}>
                    <Link
                      href={`/items/${slug}`}
                      className={cn(
                        'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors group',
                        collapsed && 'justify-center'
                      )}
                      title={collapsed ? type.name : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" style={{ color: type.color }} />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{type.name}</span>
                          <span className="text-xs tabular-nums">{type.count}</span>
                        </>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Collections — hidden when collapsed */}
        {!collapsed && (
          <div className="px-2">
            <button
              onClick={() => setCollectionsExpanded(!collectionsExpanded)}
              className="flex items-center justify-between w-full px-2 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
            >
              <span>Collections</span>
              <ChevronRight
                className={cn('h-3 w-3 transition-transform', collectionsExpanded && 'rotate-90')}
              />
            </button>

            {collectionsExpanded && (
              <>
                {/* Favorites */}
                <p className="px-2 mb-1 text-xs text-muted-foreground/60 uppercase tracking-wider">
                  Favorites
                </p>
                <ul className="space-y-0.5 mb-3">
                  {favoriteCollections.map((col) => (
                    <li key={col.id}>
                      <Link
                        href={`/collections/${col.id}`}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Star className="h-3.5 w-3.5 shrink-0 text-yellow-400 fill-yellow-400" />
                        <span className="truncate">{col.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* All Collections */}
                <p className="px-2 mb-1 text-xs text-muted-foreground/60 uppercase tracking-wider">
                  All Collections
                </p>
                <ul className="space-y-0.5">
                  {recentCollections.map((col) => (
                    <li key={col.id}>
                      <Link
                        href={`/collections/${col.id}`}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <span className="flex-1 truncate">{col.name}</span>
                        <span className="text-xs tabular-nums">{col.itemCount}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      {/* User area */}
      <div
        className={cn(
          'border-t border-border p-3 shrink-0',
          collapsed ? 'flex justify-center' : 'flex items-center gap-2'
        )}
      >
        <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold shrink-0">
          {mockUser.name[0]}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight truncate">{mockUser.name}</p>
              <p className="text-xs text-muted-foreground truncate">{mockUser.email}</p>
            </div>
            <button
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-border bg-background shrink-0 transition-[width] duration-200',
          collapsed ? 'w-14' : 'w-60'
        )}
      >
        {renderContent(false)}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={onMobileClose}
            aria-hidden
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-background border-r border-border z-50 md:hidden flex flex-col">
            {renderContent(true)}
          </aside>
        </>
      )}
    </>
  )
}
