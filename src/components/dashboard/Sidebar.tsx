'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import {
  File,
  Star,
  ChevronRight,
  PanelLeft,
  LogOut,
  Settings,
  User,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { typeIconMap } from '@/lib/item-type-icons'
import { UserAvatar } from '@/components/UserAvatar'
import type { SystemItemType } from '@/lib/db/items'
import type { SidebarCollection } from '@/lib/db/collections'

export interface SidebarUser {
  name?: string | null
  email?: string | null
  image?: string | null
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
  itemTypes: SystemItemType[]
  sidebarCollections: SidebarCollection[]
  user?: SidebarUser | null
}

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
  itemTypes,
  sidebarCollections,
  user,
}: SidebarProps) {
  const [typesExpanded, setTypesExpanded] = useState(true)
  const [collectionsExpanded, setCollectionsExpanded] = useState(true)

  const favoriteCollections = sidebarCollections.filter((c) => c.isFavorite)
  const otherCollections = sidebarCollections.filter((c) => !c.isFavorite)

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
              {itemTypes.map((type) => {
                const Icon = typeIconMap[type.icon ?? ''] ?? File
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
                      <Icon className="h-4 w-4 shrink-0" style={{ color: type.color ?? undefined }} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 flex items-center gap-1.5">
                            {type.name}
                            {(type.name === 'file' || type.name === 'image') && (
                              <Badge variant="outline" className="h-4 px-1 text-[10px] font-semibold text-muted-foreground border-muted-foreground/30">
                                PRO
                              </Badge>
                            )}
                          </span>
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

                {/* All collections */}
                <p className="px-2 mb-1 text-xs text-muted-foreground/60 uppercase tracking-wider">
                  All
                </p>
                <ul className="space-y-0.5 mb-2">
                  {otherCollections.map((col) => (
                    <li key={col.id}>
                      <Link
                        href={`/collections/${col.id}`}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: col.dominantColor ?? '#6b7280' }}
                        />
                        <span className="truncate flex-1">{col.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* View all collections */}
                <Link
                  href="/collections"
                  className="flex items-center px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  View all collections →
                </Link>
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
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md hover:bg-muted transition-colors p-1 -m-1 min-w-0">
            <UserAvatar name={user?.name} image={user?.image} />
            {!collapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium leading-tight truncate">{user?.name ?? 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48">
            <DropdownMenuItem className="gap-2 p-0">
              <Link href="/profile" className="flex items-center gap-2 w-full px-2 py-1.5">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 p-0">
              <Link href="/settings" className="flex items-center gap-2 w-full px-2 py-1.5">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2"
              onClick={() => signOut({ callbackUrl: '/sign-in' })}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
