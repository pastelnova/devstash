# Current Feature

Code Scanner Quick Wins

## Status

In Progress

## Goals

Address low-risk findings from the code-scanner audit. No auth, no migrations, no architectural changes.

1. **Extract shared `typeIconMap`** — duplicated in `Sidebar.tsx`, `CollectionsSection.tsx`, and `ItemRow.tsx` with a live icon discrepancy (`StickyNote` renders differently across files). Extract to `src/lib/item-type-icons.ts` and fix the discrepancy.

2. **`DATABASE_URL` startup guard** — replace `process.env.DATABASE_URL!` in `src/lib/prisma.ts` with an explicit check that throws a clear error if the var is missing.

3. **`RecentItems` empty-state guard** — add `if (items.length === 0) return null` to match the existing guard in `PinnedItems.tsx`.

4. **Fix array index as React `key`** — in `CollectionsSection.tsx` type icon map, use `iconKey` string as the key instead of the array index `i`.

5. **Rename "Recent" collections label** — `recentCollections` is just `!isFavorite`, not sorted by recency. Rename variable to `otherCollections` and the UI label to "All".

6. **Add `take` limit on nested items in collection queries** — `getSidebarCollections` and `getCollections` in `src/lib/db/collections.ts` load all items per collection unboundedly. Add `take: 20` to the nested `items` include since only enough rows are needed to determine dominant type.

## Notes

- Skip #1 (auth guard) and #3 (extra DB query) — both resolve naturally when NextAuth is implemented
- Skip `contentType` enum migration — save for when item-creation code is being built
- Skip sidebar dual-DOM desync (#12) — cosmetic, low value now

## History

<!-- Keep this updated. Earliest to latest -->

### 2026-03-27 — Initial Next.js & Tailwind Setup

- Scaffolded project with Next.js (App Router, React 19, TypeScript)
- Configured Tailwind CSS v4 with CSS-based theme in `globals.css`
- Added `CLAUDE.md` and `context/` documentation files
- Removed default Next.js placeholder assets from `public/`
- Committed and pushed to `https://github.com/pastelnova/devstash.git`

### 2026-03-30 — Dashboard UI Phase 1

- Initialized ShadCN UI (Tailwind v4 detected automatically)
- Installed Button and Input ShadCN components
- Created `/dashboard` route at `src/app/dashboard/page.tsx`
- Added dark mode by default (`dark` class on `<html>`)
- Built top bar with logo, search input, "New Collection" and "+ New Item" buttons (display only)
- Added sidebar and main area placeholders (h2 "Sidebar" / "Main")
- Updated root metadata to DevStash

### 2026-03-30 — Dashboard UI Phase 2

- Built collapsible sidebar (`src/components/dashboard/Sidebar.tsx`) with desktop toggle (PanelLeft icon) and mobile X close button
- Sidebar collapses to icon-only strip (`w-14`) on desktop
- Item types linked to `/items/[slug]` with colored icons and counts
- Favorite collections section (starred) and All Collections section in sidebar
- User avatar, name, email, and settings icon at the bottom of the sidebar
- Mobile view always uses a drawer overlay (backdrop + fixed panel)
- Hamburger button in header opens the mobile drawer
- Extracted `DashboardShell.tsx` as client component managing sidebar state
- `page.tsx` remains a server component

### 2026-03-30 — Dashboard UI Phase 3

- Added 4 stats cards (`src/components/dashboard/StatsCards.tsx`) for total items, collections, favorite items, and favorite collections
- Built collections grid (`src/components/dashboard/CollectionsSection.tsx`) with 3-column layout, star badge, item count, description, and type icons
- Created reusable `ItemRow.tsx` with colored type icon circle, title, description, tags, and date
- Added pinned items section (`src/components/dashboard/PinnedItems.tsx`) using `isPinned` flag
- Added recent items section (`src/components/dashboard/RecentItems.tsx`) sorted by date, capped at 10
- Updated `page.tsx` with full dashboard layout: heading, stats, collections, pinned, recent
- All data sourced from `src/lib/mock-data.ts`

### 2026-04-01 — Prisma + Neon PostgreSQL Setup

- Installed Prisma 7, `@prisma/adapter-pg`, `pg`, and `dotenv`
- Created `prisma/schema.prisma` with `provider = "prisma-client"` and explicit `output = "../generated/prisma"` (Prisma 7 breaking change — no longer generates into `node_modules`)
- Created `prisma.config.ts` with `datasource.url` config (Prisma 7 breaking change — `url` removed from datasource block in schema)
- Defined all app models: `User`, `Item`, `ItemType`, `Collection`, `Tag`, `ItemTag`
- Added NextAuth v5 models: `Account`, `Session`, `VerificationToken`
- Added cascade deletes and indexes on all foreign keys
- Created `src/lib/prisma.ts` using `PrismaPg` driver adapter with global singleton pattern (Prisma 7 breaking change — driver adapter required at runtime)
- Added `/generated` to `.gitignore`
- Ran `prisma migrate dev --name init` — migration applied to Neon dev branch
- Build passes

### 2026-04-01 — Seed Data

- Installed `bcryptjs` (+ `@types/bcryptjs`)
- Rewrote `prisma/seed.ts` with full demo dataset per spec
- Seeded 7 system item types with correct names, icons, and colors
- Created demo user `demo@devstash.io` with bcrypt-hashed password (12 rounds)
- Created 17 tags and 5 collections: React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources
- 18 items total: 5 snippets, 3 prompts, 5 commands, 5 links — with tags, favorites, and pins
- Seed is idempotent (upsert on stable IDs)
- Build passes

### 2026-04-01 — Dashboard Collections — Real DB Data

- Created `src/lib/db/collections.ts` with `getCollections(userId)` — fetches collections with nested items and types via Prisma
- Dominant border color derived from most-used item type per collection
- Type icons sorted by usage frequency (most common first)
- Updated `CollectionsSection.tsx` to accept `CollectionWithMeta[]` props; icon map updated for DB icon names (`Code`, `Sparkles`, `Terminal`, `StickyNote`, `File`, `Image`, `Link`)
- Updated `dashboard/page.tsx` to look up demo user and fetch real collections; has TODO to swap in session user once auth is in place
- Build passes

### 2026-04-02 — Dashboard Items — Real DB Data

- Created `src/lib/db/items.ts` with `getPinnedItems(userId)`, `getRecentItems(userId)`, and `getItemStats(userId)`
- `ItemRow.tsx` updated to use `ItemWithMeta` type; icon resolved from item's nested type relation (no mock lookup)
- `PinnedItems.tsx` now accepts `items: ItemWithMeta[]` as prop; hides section when empty
- `RecentItems.tsx` now accepts `items: ItemWithMeta[]` as prop
- `StatsCards.tsx` now accepts `stats: ItemStats` as prop; counts fetched from DB
- `dashboard/page.tsx` fetches all 4 data sources in parallel with `Promise.all` and passes as props
- Build passes

### 2026-04-02 — Stats & Sidebar — Real DB Data

- Added `getSystemItemTypes(userId)` to `src/lib/db/items.ts` — fetches system item types with per-user item counts
- Added `getSidebarCollections(userId)` to `src/lib/db/collections.ts` — fetches all collections with dominant color from most-used item type
- Updated `dashboard/page.tsx` to fetch both in the existing `Promise.all` and pass as props to `DashboardShell`
- Updated `DashboardShell.tsx` to accept and forward `itemTypes` and `sidebarCollections` props to `Sidebar`
- Updated `Sidebar.tsx` to replace all mock data with props; recents show a colored circle based on dominant item type color; favorites keep star icon; added "View all collections →" link to `/collections`
- Build passes

### 2026-04-02 — Pro Badge in Sidebar

- Installed shadcn `Badge` component
- Added subtle `PRO` outline badge inline next to the **file** and **image** type names in the sidebar
- Badge hidden when sidebar is collapsed; count stays pinned to the right
- Build passes
