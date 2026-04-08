# Current Feature: Rate Limiting for Auth

## Status
In Progress

## Goals
- Install `@upstash/ratelimit` and `@upstash/redis` packages
- Create reusable `src/lib/rate-limit.ts` utility with Upstash Redis sliding window
- Rate limit login (5/15min by IP+email), register (3/1hr by IP), forgot-password (3/1hr by IP), reset-password (5/15min by IP)
- Return 429 with `Retry-After` header and user-friendly error message
- Update frontend forms to display rate limit errors via toast
- Fail open if Upstash is unavailable (allow request through)

## Notes
- Uses Upstash Redis (serverless-compatible) — free tier allows 10k requests/day
- Env vars needed: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Login rate limiting with NextAuth credentials may need custom sign-in handler since NextAuth handles `/api/auth/callback/credentials` internally
- IP extracted from `x-forwarded-for` header (Vercel) or fallback
- Sliding window algorithm for smooth rate limiting

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
