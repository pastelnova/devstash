---
name: DevStash Codebase Audit — April 2026
description: Findings from the first full security/perf/quality scan of the DevStash codebase
type: project
---

First full scan completed 2026-04-02.

Key findings by area:

**Security**
- dashboard/page.tsx hardcodes the demo user email ('demo@devstash.io') directly in the server component instead of using a session. No auth is implemented yet — this is a known TODO, not an oversight.
- Sidebar.tsx hardcodes "Demo User" / "demo@devstash.io" strings in the user area UI — same root cause.
- DATABASE_URL uses non-null assertion (!) in prisma.ts — will crash at startup if env var is missing, but silently; no helpful error message.
- seed.ts demo password "12345678" is trivial — acceptable for seed data but worth noting.

**Performance**
- getSidebarCollections and getCollections both issue the same query shape (collections + items + type) in parallel from dashboard/page.tsx. These two functions load all items for every collection with no limit — if a collection has 1000 items, all are fetched just to compute dominant color. This is a scalable hot-path issue.
- getSystemItemTypes fetches ALL system types (no userId filter on isSystem:true rows) then uses a filtered _count — correct but fetches 7 rows, fine for now.
- getItemStats fires 4 separate COUNT queries sequentially wrapped in Promise.all — good parallelism, no issue.
- Sidebar renders its full content twice via renderContent() — once for desktop, once for mobile drawer. Both instances are in the DOM at the same time on desktop+mobile breakpoints, each with their own useState for typesExpanded/collectionsExpanded. State is not shared between instances.
- Dashboard fetches 6 queries in one Promise.all — good pattern.

**Code Quality**
- mock-data.ts is no longer used by any component (all consumers switched to DB) but still lives in src/lib/. Dead file.
- typeIconMap is duplicated in 3 files: Sidebar.tsx, CollectionsSection.tsx, ItemRow.tsx. Should be extracted to a shared lib.
- CollectionsSection.tsx uses array index as React key for type icons (key={i}) — can cause rendering issues if icon list changes order.
- RecentItems.tsx renders an empty bordered card when items array is empty (no empty-state guard like PinnedItems has).
- Sidebar.tsx "Recent" label groups non-favorite collections, not actually recently-used collections. Naming mismatch.
- contentType field on Item is a plain string ("text" | "file") — no enum constraint at the DB level or Zod validation.

**Architecture**
- No auth middleware or route protection exists yet — documented as TODO.
- No Server Actions exist yet — all data flows through server components directly, which is correct for the current read-only dashboard.
- DashboardShell is a client component that wraps the full layout including the header search bar (readOnly input) — fine for now, but will need splitting when search becomes interactive.

**Why:** Scanning for issues before auth and CRUD features are added, so they can be fixed in isolation before complexity grows.
**How to apply:** Reference this when prioritising upcoming work. The dead mock-data.ts and duplicate typeIconMap are quick wins. The collection item-loading scalability issue should be addressed before implementing filtering/search at scale.
