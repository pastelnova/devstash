# Current Feature

## Status
Not Started

## Goals
<!-- Goals will be populated by /feature load -->

## Notes
<!-- Additional context and constraints -->

## History

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

### 2026-04-04 — Code Scanner Quick Wins

- Extracted shared `typeIconMap` to `src/lib/item-type-icons.ts`; fixed `StickyNote` icon discrepancy (was `FileText` in `Sidebar` and `ItemRow`, now `StickyNote` everywhere)
- Added `DATABASE_URL` startup guard in `src/lib/prisma.ts` — throws clear error instead of silent crash
- Added empty-state guard to `RecentItems.tsx` (`return null` when empty, matching `PinnedItems`)
- Fixed array index used as React `key` in `CollectionsSection.tsx` type icons — now uses `iconKey` string
- Renamed `recentCollections` → `otherCollections`; sidebar label "Recent" → "All"
- Added `take: 20` on nested items in both collection queries; `itemCount` now uses `_count.items` for accuracy
- Build passes

### 2026-04-06 — Auth Setup — NextAuth + GitHub Provider

- Installed `next-auth@beta` and `@auth/prisma-adapter`
- Created split auth config: `src/auth.config.ts` (edge-safe, GitHub provider only) + `src/auth.ts` (full config with PrismaAdapter)
- JWT session strategy with `user.id` injected via `jwt` and `session` callbacks
- Created API route handler at `src/app/api/auth/[...nextauth]/route.ts`
- Created `src/proxy.ts` protecting `/dashboard/*` routes — redirects unauthenticated users to NextAuth sign-in
- Extended Session type with `user.id` in `src/types/next-auth.d.ts`
- Added auth feature specs to `context/features/`
- Build passes

### 2026-04-06 — Auth Credentials — Email/Password Provider

- Added Credentials provider placeholder in `auth.config.ts` (edge-safe, `authorize: () => null`)
- Overrode Credentials in `auth.ts` with bcrypt validation (split pattern preserved)
- Created `POST /api/auth/register` route with input validation, duplicate check (409), password hashing (bcrypt 12 rounds)
- No migration needed — `password` field already existed on User model
- GitHub OAuth preserved alongside credentials
- Build passes

### 2026-04-07 — Auth UI — Sign In, Register & Sign Out

- Custom sign-in page (`/sign-in`) with email/password form and GitHub OAuth button; server component with client `SignInForm`
- Custom register page (`/register`) with name, email, password, confirm password validation; server component with client `RegisterForm`
- Registration redirects to `/sign-in?registered=true` with success toast via sonner
- Configured `pages: { signIn: "/sign-in" }` in `auth.config.ts`
- Created reusable `UserAvatar` component (`src/components/UserAvatar.tsx`) — GitHub image via `next/image` or initials fallback
- Updated sidebar user area with `UserAvatar` and dropdown menu (Profile link → `/profile`, Sign out)
- `DashboardShell` accepts and forwards `user` prop to `Sidebar`
- Dashboard page now uses `auth()` session instead of hardcoded demo user lookup
- Added `avatars.githubusercontent.com` to `next.config.ts` remote image patterns
- Installed shadcn components: card, label, dropdown-menu, sonner
- Build passes

### 2026-04-07 — Email Verification on Register

- Installed `resend` package for email delivery
- Created `src/lib/resend.ts` — Resend client singleton with `RESEND_API_KEY` env guard
- Created `src/lib/auth/verification.ts` with `generateVerificationToken()`, `sendVerificationEmail()`, and `verifyToken()` helpers
- Tokens stored in existing `VerificationToken` model; 24-hour expiry; old tokens cleaned on new generation
- Updated `/api/auth/register` to generate token and send verification email after user creation
- Registration now redirects to `/check-email` page instead of sign-in
- Created `/check-email` page with inbox prompt and 24h expiry notice
- Created `/verify-email` server page — validates token, sets `emailVerified` on User, deletes used token
- Handles edge cases: missing token, expired token, invalid token — with "Register again" link
- Success state shows checkmark and "Sign in" link
- Added `EmailNotVerifiedError` (extends `CredentialsSignin`) in `src/auth.ts` — unverified users rejected at sign-in
- `SignInForm` shows distinct error message for unverified vs invalid credentials
- Created reusable `ButtonLink` client component for server-compatible button-styled links
- Added `db:cleanup` script (`scripts/cleanup-users.ts`) and `npm run db:cleanup` command
- Build passes

### 2026-04-07 — Toggle Email Verification

- Added `REQUIRE_EMAIL_VERIFICATION` env var (defaults to `false`)
- When disabled: new users are pre-verified (`emailVerified` set on creation), verification email skipped
- When enabled: existing flow unchanged (token generated, email sent, must verify before sign-in)
- Updated register route, credentials authorize, and RegisterForm redirect logic
- Added env var to `.env` with descriptive comment
- Build passes

### 2026-04-07 — Forgot Password

- Created `src/lib/auth/password-reset.ts` with `generatePasswordResetToken()`, `sendPasswordResetEmail()`, and `resetPassword()` helpers
- Tokens reuse existing `VerificationToken` model; 1-hour expiry (shorter than email verification's 24h)
- Created `POST /api/auth/forgot-password` route — prevents email enumeration, skips OAuth-only users
- Created `POST /api/auth/reset-password` route — validates token, hashes new password (bcrypt 12 rounds)
- Created `/forgot-password` page with `ForgotPasswordForm` client component — email input with "check your email" success state
- Created `/reset-password` server page with `ResetPasswordForm` client component — new password + confirm, success state with sign-in link
- Handles missing token (server page), expired token, invalid token, and user-not-found edge cases
- Added "Forgot password?" link to `SignInForm` next to password label
- Fixed `baseUrl` operator precedence bug in both `verification.ts` and `password-reset.ts`
- Build passes

### 2026-04-07 — Profile Page

- Created `/profile` route as protected server component with DashboardShell
- User info card with avatar (lg size added to `UserAvatar`), name, email, and join date
- Usage stats card: total items, total collections, per-type breakdown with colored icons
- Change password form (`ChangePasswordSection`) — only shown for email/password users
- Change password API route (`POST /api/auth/change-password`) with current password validation
- Delete account with confirmation dialog (`DeleteAccountSection`) using shadcn dialog (base-ui)
- Delete account API route (`DELETE /api/auth/delete-account`) with cascading delete + sign out
- Created `src/lib/db/profile.ts` with `getProfileStats()` and `hasPassword()` queries
- Installed shadcn `dialog` component
- Build passes

### 2026-04-08 — Rate Limiting for Auth

- Installed `@upstash/ratelimit` and `@upstash/redis` packages
- Created `src/lib/rate-limit.ts` with reusable `checkRateLimit()` utility using Upstash Redis sliding window
- Pre-configured rate limiters: login (5/15min by IP+email), register (3/1hr by IP), forgot-password (3/1hr by IP), reset-password (5/15min by IP)
- Added rate limiting to `authorize` callback in `src/auth.ts` via `RateLimitError` (extends `CredentialsSignin`)
- Added rate limiting to register, forgot-password, and reset-password API routes
- Returns 429 with `Retry-After` header and human-readable error message
- All rate limiters fail open (allow request) if Upstash is unavailable — 3s timeout
- Updated all four auth frontend forms to display rate limit errors inline
- Build passes

### 2026-04-08 — Fix GitHub OAuth Redirect

- Created `src/actions/auth.ts` with `signInWithGitHub` server action using `signIn` from `@/auth`
- Updated `SignInForm.tsx` — GitHub button now uses `<form action={signInWithGitHub}>` instead of client-side `onClick` with `signIn` from `next-auth/react`
- Uses `redirectTo: "/dashboard"` (NextAuth v5 pattern) for server-side redirect
- Credentials login unchanged (still client-side `signIn` with `redirect: false`)
- Build passes

### 2026-04-09 — Dashboard Card Left Borders

- `CollectionsSection.tsx` — collection cards now use `border-l-4` with only `borderLeftColor` set to the dominant type color (was full colored border)
- `ItemRow.tsx` — reworked from list row to standalone card: `rounded-lg border border-l-4 bg-card p-3` with `borderLeftColor` set to the item's type color
- `PinnedItems.tsx` / `RecentItems.tsx` — removed outer card wrapper; now `flex flex-col gap-2` so each ItemRow stands as its own card with small margins between them
- Build passes

### 2026-04-09 — Items List View

- Created dynamic route `src/app/items/[type]/page.tsx` — protected server component wrapped in `DashboardShell`
- Added `getSystemItemTypeBySlug(slug)` and `getItemsByType(userId, typeId)` to `src/lib/db/items.ts`
- Slug resolver accepts both singular (`/items/snippet`) and plural (`/items/snippets`) forms; 404s on unknown slugs via `notFound()`
- New `src/components/items/ItemCard.tsx` — vertical card with colored left border, type icon circle, title, description, tags, and date
- Responsive grid: 1 column on mobile, 2 columns from `md` up
- Page header shows type icon + pluralized title + item count; empty state when no items exist
- Build passes

### 2026-04-09 — Vitest Unit Testing Setup

- Installed `vitest` and `@vitest/coverage-v8` as dev dependencies
- Added `vitest.config.ts` — `node` environment, globals enabled, `resolve.tsconfigPaths: true` for `@/*` aliases, tests scoped to `src/actions/**` and `src/lib/**` (components explicitly excluded)
- Added `"types": ["vitest/globals"]` to `tsconfig.json` for ambient `describe`/`it`/`expect`
- Added `test`, `test:run`, and `test:coverage` scripts to `package.json`
- Added sample test `src/lib/utils.test.ts` covering `cn()` — all tests pass
- Updated `CLAUDE.md`, `context/coding-standards.md`, and `context/ai-interaction.md` with testing scope (server actions + lib only, no components), conventions, and updated workflow step
- Build and lint pass

### 2026-04-09 — Items List 3-Column Grid

- Updated `src/app/items/[type]/page.tsx` grid container from `grid-cols-1 md:grid-cols-2` to `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Responsive: 1 column on mobile, 2 columns from `md`, 3 columns from `lg` (≥1024px)
- Verified in browser after dev server restart (Tailwind v4 JIT needed a fresh scan to pick up the new `lg:grid-cols-3` class)
- Build and tests pass

### 2026-04-09 — Item Drawer

- Installed shadcn `sheet` component
- Added `getItemDetail(userId, itemId)` to `src/lib/db/items.ts` — full item with type, collection, tags, content, url, language
- Created `GET /api/items/[id]` route with auth check — 401 unauthorized, 404 when item missing or not owned by user
- Built `src/components/items/ItemDrawer.tsx` — right-side shadcn Sheet, skeleton loading state, action bar (Favorite ★ yellow when active, Pin, Copy, Edit, right-aligned Delete), meta grid, tags, content (pre/mono), URL
- Built `src/components/items/ItemDrawerContext.tsx` — `ItemDrawerProvider` + `useItemDrawer()` hook managing open state and selected item id; clears id after close animation
- `ItemCard.tsx` and `ItemRow.tsx` converted to client `<button>` components that call `openItem(id)` on click
- Provider mounted in `DashboardShell.tsx` so drawer works on dashboard and items list pages without page changes
- Copy button writes `content ?? url ?? title` to clipboard; Favorite/Pin/Edit/Delete wired visually only (mutations out of scope per spec)
- Build passes, all existing tests pass

### 2026-04-09 — Item Drawer Edit Mode

- Installed `zod` for input validation
- Added `updateItem(userId, itemId, input)` to `src/lib/db/items.ts` — transactional: updates fields, deletes all `ItemTag` rows, upserts `Tag` rows by `(name, userId)`, recreates joins; returns full `ItemDetail` via `getItemDetail`
- Created `src/actions/items.ts` with `updateItem` server action — Zod schema (title required, nullable trimmed strings, `z.url()` validation, tag dedupe), `auth()` + ownership check, `{ success, data, error }` contract. Schema is module-local (not exported) because `"use server"` files can only export async functions
- Split `ItemDrawer.tsx` into `DrawerViewBody` / `DrawerEditBody`; Edit button toggles `editing` state; Save/Cancel replace the action bar in edit mode
- Editable fields: title (required), description, tags (comma-separated); type-specific content (snippet/prompt/command/note), language (snippet/command), url (link)
- Non-editable in edit mode: item type, collection, dates
- Uses `useTransition` for pending state; sonner toasts on success/error; `router.refresh()` after save so card lists reflect changes
- Save disabled client-side while title is empty; Zod is server-side source of truth
- Added `src/actions/items.test.ts` — 6 Vitest cases: unauthorized, empty title, invalid URL, ownership miss, happy path (asserts trim + tag dedupe), query throw
- Build and all 9 tests pass

### 2026-04-09 — Item Delete

- Installed shadcn `alert-dialog` component
- Added `deleteItem(itemId)` to `src/lib/db/items.ts` — Prisma delete; cascades remove `ItemTag` rows via schema; caller verifies ownership
- Added `deleteItem` server action to `src/actions/items.ts` — `auth()` + ownership check via `findFirst`, `{ success, data: { id }, error }` contract
- Wired Delete button in `ItemDrawer.tsx` with controlled `AlertDialog` (destructive styling); confirmation shows the item title
- On success: sonner toast, drawer closes via `onOpenChange(false)`, `router.refresh()` so pinned/recent/items-by-type/stats reflect the deletion; on error: sonner error toast
- Uses `useTransition` for pending state; Delete button and Cancel disabled while deleting
- Added 4 Vitest cases to `src/actions/items.test.ts`: unauthorized, ownership miss, happy path, query throw
- Build and all 13 tests pass

### 2026-04-09 — Item Create

- Added `createItem(userId, input)` to `src/lib/db/items.ts` — transactional: creates `Item` with `contentType: 'text'`, upserts `Tag` rows by `(name, userId)`, creates joins; returns full `ItemDetail` via `getItemDetail`
- Added `createItem` server action to `src/actions/items.ts` — Zod schema with `type` enum (`snippet`/`prompt`/`command`/`note`/`link`), refine rule requiring URL for link type, reuses `nullableTrimmedString` + tag dedupe from update schema. Looks up system `ItemType` by name inside the action, returns `{ success, data, error }`
- Created `src/components/items/ItemCreateDialog.tsx` — shadcn Dialog with 5-button segmented type selector (colored icon + label from `typeIconMap`), conditional fields per type (content for snippet/prompt/command/note, language for snippet/command, url for link), form reset on close, sonner toast + `router.refresh()` on success
- Wired "New Item" top bar button in `DashboardShell.tsx` to open the dialog; passes through existing `itemTypes` prop
- Added 7 Vitest cases to `src/actions/items.test.ts`: unauthorized, empty title, link missing URL, invalid URL, system type not found, happy path (trim + tag dedupe + typeId forwarded), query throw
- Build and all 20 tests pass

### 2026-04-10 — Code Editor Component

- Installed `@monaco-editor/react` package
- Created `src/components/items/CodeEditor.tsx` — Monaco Editor wrapper with macOS window dots (red/yellow/green), language label, copy button with "Copied" feedback, `vs-dark` theme, fluid height (min 100px, max 400px), slim 8px scrollbars, no minimap
- Updated `ItemDrawer.tsx` view mode — snippets and commands use `CodeEditor` (readonly) instead of `<pre>`; notes and prompts keep plain `<pre>`
- Updated `ItemDrawer.tsx` edit mode — snippets and commands use `CodeEditor` (editable) instead of `<textarea>`; notes and prompts keep `<textarea>`
- Updated `ItemCreateDialog.tsx` — same split: `CodeEditor` for snippet/command content, `<textarea>` for note/prompt
- Added `defaultType` prop to `ItemCreateDialog` for pre-selecting item type on open
- Exported `useOpenCreateDialog` context from `DashboardShell` so child components can trigger the create dialog
- Added `defaultCreateType` prop to `DashboardShell`, forwarded to the dialog
- Created `src/components/items/NewItemByTypeButton.tsx` — "New [Type]" button using the create dialog context
- Updated `src/app/items/[type]/page.tsx` — renders type-specific "New [Type]" button in the page header; passes `defaultCreateType` to `DashboardShell`
- Build and all 20 tests pass

### 2026-04-10 — Markdown Editor for Notes & Prompts

- Installed `react-markdown`, `remark-gfm`, and `@tailwindcss/typography`
- Registered `@plugin "@tailwindcss/typography"` in `globals.css` (Tailwind v4 CSS-based config)
- Created `src/components/items/MarkdownEditor.tsx` — Write/Preview tabbed editor with `react-markdown` + `remark-gfm`, copy button, dark theme container matching CodeEditor styling (`bg-[#1e1e1e]` body, `bg-[#252526]` header)
- Preview uses `prose prose-invert prose-sm` classes from `@tailwindcss/typography` for proper rendering of headings, code blocks, inline code, lists, blockquotes, links, tables, and task lists
- Readonly mode shows Preview tab only; edit mode defaults to Write tab with Preview available
- Fluid height with max 400px matching CodeEditor
- Updated `ItemDrawer.tsx` view mode — notes and prompts use `MarkdownEditor` (readonly) instead of `<pre>`
- Updated `ItemDrawer.tsx` edit mode — notes and prompts use `MarkdownEditor` instead of `<textarea>`
- Updated `ItemCreateDialog.tsx` — notes and prompts use `MarkdownEditor` instead of `<textarea>`
- Snippets and commands unchanged (still use CodeEditor)
- Build and all 20 tests pass

### 2026-04-10 — File & Image Upload with Cloudflare R2

- Installed `@aws-sdk/client-s3` for R2 (S3-compatible)
- Created `src/lib/r2.ts` — R2 client singleton with `uploadToR2()`, `deleteFromR2()`, `getFromR2()` helpers
- Created `POST /api/upload` route — validates extension, MIME type, and file size (images 5 MB, files 10 MB); uploads to R2 with key `userId/type/uuid.ext`
- Created `GET /api/download/[id]` route — auth + ownership check, streams from R2; `inline` disposition for images, `attachment` for files
- Added `createFileItem()` to `src/lib/db/items.ts` — transactional create with `contentType: 'file'`, `fileUrl`, `fileName`, `fileSize`
- Updated `deleteItem()` in `src/lib/db/items.ts` to return `fileUrl` for R2 cleanup
- Added `createFileItem` server action to `src/actions/items.ts` — Zod schema for `file`/`image` types
- Updated `deleteItem` action to delete R2 file (best-effort) when item has `fileUrl`
- Created `src/components/items/FileUpload.tsx` — drag-and-drop zone with XHR upload progress circle, uploaded file preview with remove button
- Updated `ItemCreateDialog.tsx` — 7-type selector (added file and image), `FileUpload` component shown for file/image types
- Updated `ItemDrawer.tsx` — image preview via download proxy, file info card with icon and size, download button replaces copy for file/image types
- Added 8 new Vitest cases: 6 for `createFileItem` action, 2 for R2 cleanup on delete
- Build and all 28 tests pass

### 2026-04-10 — Image Gallery View

- Created `src/components/items/ImageCard.tsx` — thumbnail card with 16:9 `aspect-video`, `object-cover`, hover zoom (5% scale, 300ms transition), `bg-muted` placeholder
- Uses plain `<img>` tag (not `next/image`) because the R2 download proxy stream isn't compatible with Next.js image optimization
- Updated `src/app/items/[type]/page.tsx` — renders `ImageCard` for image type, regular `ItemCard` for all others
- Added `file` and `image` to `CREATABLE_SET` so "New File" / "New Image" buttons appear on those pages
- Clicking an image thumbnail opens the existing item drawer via `ItemDrawerContext`
- Build and all 28 tests pass

### 2026-04-10 — File List View

- Created `src/components/items/FileRow.tsx` — single-column list row with extension-based file icon (code, text, image, archive, spreadsheet), file name, size, upload date, and download button
- Row click opens ItemDrawer via `useItemDrawer`; download button uses `stopPropagation` for direct download
- Hover highlight with `hover:bg-muted/30` and colored left border matching file type color
- Responsive: size and date columns hidden on mobile (`hidden sm:flex`)
- Added `FileItemMeta` type and `getFileItemsByType()` to `src/lib/db/items.ts` — lightweight query with file-specific fields
- Updated `src/app/items/[type]/page.tsx` — file type renders `FileRow` in flex column layout; other types unchanged
- Build and all 28 tests pass

### 2026-04-10 — Extract Drawer Components & DB Helpers

- Extracted `DrawerViewBody` from `ItemDrawer.tsx` to `src/components/items/DrawerViewBody.tsx` (~240 lines)
- Extracted `DrawerEditBody` from `ItemDrawer.tsx` to `src/components/items/DrawerEditBody.tsx` (~195 lines)
- Extracted shared helpers (`TypeIconBadge`, `MetaRow`, type-set constants) to `src/components/items/drawer-shared.tsx`
- `ItemDrawer.tsx` reduced from 570 to 115 lines (shell + skeleton only)
- Extracted `upsertTags(tx, userId, itemId, tags)` helper in `src/lib/db/items.ts` — deduplicated tag upsert loop from `updateItem`, `createItem`, `createFileItem`
- Extracted `toItemWithMeta` mapper in `src/lib/db/items.ts` — deduplicated Prisma-to-`ItemWithMeta` transform from `getPinnedItems`, `getRecentItems`, `getItemsByType`
- Pure refactor, no behavior changes
- Build and all 28 tests pass

### 2026-04-11 — Item-Collection Assignment

- Migrated schema from single `Item.collectionId` FK to many-to-many `CollectionItem` join table (follows `ItemTag` pattern with `@@id([collectionId, itemId])`)
- Created migration `20260411100848_item_collection_many_to_many` — preserves existing assignments during migration
- Updated `getItemDetail` to include `collections` via join table; added `ItemDetail.collections` array
- Updated `createItem`, `updateItem`, `createFileItem` in `src/lib/db/items.ts` to accept and sync `collectionIds: string[]`
- Updated server actions and Zod schemas to accept `collectionIds` array
- Created `src/components/items/CollectionSelect.tsx` — multi-select dropdown for choosing collections
- Added `CollectionSelect` to `ItemCreateDialog` and `DrawerEditBody`
- Updated `DrawerViewBody` to display multiple collections
- Updated `CollectionsSection` to show type icons with correct colors (was grey)
- Updated sidebar and collection queries for join table (`getSidebarCollections`, `getCollections`)
- Updated seed data to use `CollectionItem` join table
- Updated `ItemDrawerContext` to pass collections data through
- Build and all 34 tests pass

### 2026-04-11 — Collections Pages

- Created `/collections` page (`src/app/collections/page.tsx`) — lists all user collections in a 3-column grid with colored left borders, type icons, item counts, and empty state; cards link to `/collections/[id]`
- Created `/collections/[id]` page (`src/app/collections/[id]/page.tsx`) — shows collection name with total item count, description, per-type icon breakdown; items grouped by type: `ItemCard` for regular items, `ImageCard` for images, `FileRow` for files; back link to `/collections`
- Added `getAllCollections(userId)` to `src/lib/db/collections.ts` — like `getCollections` but without `take: 6` limit
- Added `getCollectionById(userId, collectionId)` to `src/lib/db/collections.ts` — returns `CollectionDetail` with ownership check
- Extracted `toCollectionWithMeta` shared mapper in `src/lib/db/collections.ts` — deduplicated from `getCollections` and `getAllCollections`
- Added `CollectionItemWithMeta` type and `getItemsByCollection(userId, collectionId)` to `src/lib/db/items.ts` — includes `typeName`, `fileName`, `fileSize` for type-aware rendering
- Updated `CollectionsSection.tsx` — collection cards now wrapped in `<Link>` to `/collections/[id]`
- Sidebar "View all collections" and individual collection links already pointed to correct routes
- Build and all 34 tests pass

### 2026-04-10 — Code Scanner Quick Wins 2

- Extracted `formatFileSize` to `src/lib/utils.ts`; removed duplicates from `FileRow.tsx`, `FileUpload.tsx`, `ItemDrawer.tsx`
- Extracted `Field` component to `src/components/items/ItemFormField.tsx`; removed duplicates from `ItemDrawer.tsx` and `ItemCreateDialog.tsx`
- Moved `capitalize` from `ItemDrawer.tsx` to `src/lib/utils.ts`
- Replaced `window.location.href = '/profile'` with Next.js `<Link>` in `Sidebar.tsx`
- Added `.max(50)` on tag strings and `.max(20)` on tag arrays in all 3 Zod schemas in `src/actions/items.ts`
- Sanitized `Content-Disposition` filename by stripping `"` and `\` in download route
- Normalized email to `.toLowerCase().trim()` at register and credentials authorize
- Build and all 28 tests pass

### 2026-04-10 — Collection Create

- Added `createCollection(userId, input)` to `src/lib/db/collections.ts` — Prisma create with select, returns `CollectionBasic`
- Created `src/actions/collections.ts` with `createCollection` server action — Zod schema (name required, max 100, trimmed; description nullable), auth check, `{ success, data, error }` contract
- Created `src/components/dashboard/CollectionCreateDialog.tsx` — shadcn Dialog with name + description fields, pending state, toast on success/error, `router.refresh()` after create
- Wired "New Collection" button in `DashboardShell.tsx` to open the dialog
- Added 6 Vitest cases to `src/actions/collections.test.ts`: unauthorized, empty name, name too long, trim + null description, happy path with description, query throw
- Build and all 34 tests pass

### 2026-04-13 — Collection Actions (Edit, Delete, Favorite)

- Added `updateCollection(userId, collectionId, input)` and `deleteCollection(userId, collectionId)` to `src/lib/db/collections.ts` — ownership check, delete removes `CollectionItem` join rows + `Collection` row
- Added `updateCollection` and `deleteCollection` server actions to `src/actions/collections.ts` — Zod validation for update (name required, max 100, trimmed), auth + not-found checks, `{ success, data, error }` contract
- Created `src/components/dashboard/CollectionEditDialog.tsx` — reuses `CollectionCreateDialog` pattern, pre-fills name + description, sonner toast + `router.refresh()` on save
- Created `src/components/dashboard/CollectionDeleteDialog.tsx` — `AlertDialog` with destructive styling, explains items are kept, optional `redirectTo` prop
- Created `src/components/dashboard/CollectionActions.tsx` — edit/delete/favorite icon buttons for the collection detail page header
- Created `src/components/dashboard/CollectionCard.tsx` — reusable card with 3-dot `DropdownMenu` (favorite, edit, delete), `stopPropagation` on menu so card click navigates to `/collections/[id]`
- Updated `/collections/[id]` page header — added `CollectionActions` with redirect to `/collections` on delete
- Updated `/collections` page and dashboard `CollectionsSection` to use the new `CollectionCard` component
- Favorite button is visual-only placeholder (local state toggle, no server mutation)
- Added 9 Vitest cases to `src/actions/collections.test.ts`: 5 for `updateCollection`, 4 for `deleteCollection`
- Build and all 43 tests pass

### 2026-04-13 — Global Search / Command Palette

- Installed shadcn `command` component (wraps `cmdk`) with `CommandDialog`, `CommandInput`, `CommandList`, `CommandGroup`, `CommandItem`
- Added `getSearchItems(userId)` to `src/lib/db/items.ts` — lightweight query returning `id`, `title`, `typeIcon`, `typeColor`, `typeName`
- Added `getSearchCollections(userId)` to `src/lib/db/collections.ts` — lightweight query returning `id`, `name`, `itemCount`
- Created `src/components/dashboard/CommandPalette.tsx` — `CommandDialog` with grouped Items and Collections sections, type icons, item counts
- Custom word-based substring filter on `Command` — replaces cmdk's default loose fuzzy match; each search word must appear as a substring
- Updated `DashboardShell.tsx` — `Cmd+K` / `Ctrl+K` keyboard shortcut toggles palette; top bar search replaced with button showing `⌘K` badge
- All 5 pages (dashboard, collections, collection detail, items by type, profile) updated to fetch and pass `searchItems` + `searchCollections` props
- Selecting an item opens the item drawer; selecting a collection navigates to `/collections/[id]`
- Build and all 43 tests pass

### 2026-04-13 — Pagination

- Created `src/lib/constants.ts` with `ITEMS_PER_PAGE`, `COLLECTIONS_PER_PAGE`, `DASHBOARD_COLLECTIONS_LIMIT`, `DASHBOARD_RECENT_ITEMS_LIMIT`
- Created reusable `src/components/Pagination.tsx` — numbered page links with prev/next arrows (greyed out when unavailable), ellipsis for large page ranges
- Updated `getItemsByType`, `getFileItemsByType`, `getItemsByCollection` in `src/lib/db/items.ts` — accept `page` + `perPage` params, return `{ data, total }` using Prisma `skip`/`take` + `count`
- Updated `getAllCollections` in `src/lib/db/collections.ts` — same paginated pattern with `PaginatedCollections` return type
- Replaced hardcoded limits: `getRecentItems` uses `DASHBOARD_RECENT_ITEMS_LIMIT`, `getCollections` uses `DASHBOARD_COLLECTIONS_LIMIT`
- Updated `/items/[type]` page — reads `?page=` search param, passes to paginated query, renders `<Pagination>` at bottom
- Updated `/collections` page — paginated with `COLLECTIONS_PER_PAGE`, total count in header
- Updated `/collections/[id]` page — paginated collection items with `ITEMS_PER_PAGE`
- Build and all 43 tests pass

### 2026-04-13 — Settings Page

- Created `/settings` route (`src/app/settings/page.tsx`) — protected server component wrapped in `DashboardShell`
- Moved `ChangePasswordSection` and `DeleteAccountSection` from profile page to settings page
- `ChangePasswordSection` only shown if user has a password (via `hasPassword(userId)`)
- Added "Settings" link with gear icon in sidebar user dropdown (between Profile and Sign out)
- Updated profile page to show only `ProfileInfo` and `ProfileStats`; removed `hasPassword` fetch and password/delete imports
- Components remain in `src/components/profile/` (no directory move needed)
- Build and all 43 tests pass

### 2026-04-13 — Editor Preferences Settings

- Added `editorPreferences Json?` column to User model; migration `20260413150831_add_editor_preferences`
- Created `src/types/editor-preferences.ts` with `EditorPreferences` interface, `EDITOR_DEFAULTS`, and option constants
- Added `getEditorPreferences(userId)` and `updateEditorPreferences(userId, preferences)` to `src/lib/db/profile.ts`
- Created `src/actions/editor-preferences.ts` server action with Zod validation (fontSize 10-24, tabSize 2/4/8, theme enum, booleans)
- Created `src/components/settings/EditorPreferencesSection.tsx` — dropdowns for font size, tab size, theme; switches for word wrap and minimap; auto-saves on change with optimistic update and sonner toast
- Created `src/components/settings/EditorPreferencesContext.tsx` — provider + `useEditorPreferences()` hook for client components
- Updated `DashboardShell.tsx` to wrap children with `EditorPreferencesProvider`
- All 6 pages (dashboard, items, collections, collection detail, profile, settings) fetch and pass `editorPreferences` to `DashboardShell`
- Updated `CodeEditor.tsx` — applies all preferences (fontSize, tabSize, wordWrap, minimap, theme) to Monaco Editor options
- Created `src/lib/monaco-themes.ts` with Monokai and GitHub Dark custom theme definitions; registered via `beforeMount` in CodeEditor
- Installed shadcn `select` and `switch` components
- Build and all 49 tests pass

### 2026-04-14 — Favorites Page

- Added `getFavoriteItems(userId)` to `src/lib/db/items.ts` — fetches favorited items with type name/icon/color, sorted by `updatedAt` desc
- Added `getFavoriteCollections(userId)` to `src/lib/db/collections.ts` — fetches favorited collections with item count, sorted by `updatedAt` desc
- Added `isFavorite` field to `ItemWithMeta` and `FileItemMeta` types; updated `toItemWithMeta` mapper and `getFileItemsByType` select
- Added star icon button to TopBar in `DashboardShell.tsx` linking to `/favorites` with yellow hover state
- Created `/favorites` route (`src/app/favorites/page.tsx`) — protected server component fetching favorites in parallel
- Created `src/components/favorites/FavoritesList.tsx` — compact, terminal-style list with monospace font, minimal padding, high density rows
- Items section: type icon (colored), title, type badge with colored left border, date; click opens ItemDrawer
- Collections section: folder icon, name, item count, date; click navigates to `/collections/[id]`
- Empty state with star icon and prompt to favorite items
- Added filled yellow star indicator to `ItemCard.tsx`, `ImageCard.tsx`, and `FileRow.tsx` for all favorited items
- Updated `collections/[id]/page.tsx` to pass `isFavorite` to FileRow
- Build and all 49 tests pass
