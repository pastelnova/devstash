# Item Types

DevStash ships with **7 system item types**, seeded as `ItemType` rows with `isSystem = true` and `userId = null`. Pro users can create custom types owned by their account. All items reference a type via `Item.typeId`.

Source of truth:
- [prisma/seed.ts](../prisma/seed.ts) — `SYSTEM_ITEM_TYPES` (names, icons, hex colors)
- [src/lib/item-type-icons.ts](../src/lib/item-type-icons.ts) — icon name → Lucide component map
- [prisma/schema.prisma](../prisma/schema.prisma) — `Item` / `ItemType` models

---

## The 7 System Types

| Type      | Icon (Lucide) | Hex Color | Classification   |
| --------- | ------------- | --------- | ---------------- |
| snippet   | `Code2`       | `#3b82f6` | text             |
| prompt    | `Sparkles`    | `#8b5cf6` | text             |
| command   | `Terminal`    | `#f97316` | text             |
| note      | `StickyNote`  | `#fde047` | text             |
| file      | `File`        | `#6b7280` | file (Pro)       |
| image     | `Image`       | `#ec4899` | file (Pro)       |
| link      | `Link`        | `#10b981` | URL              |

> Icon names stored in `ItemType.icon` are strings (`"Code"`, `"Sparkles"`, etc.) and resolved to components via [`typeIconMap`](../src/lib/item-type-icons.ts). Note: the DB stores `"Code"` but maps to the `Code2` Lucide component.

---

## Per-Type Reference

### 1. snippet
- **Purpose:** Reusable code blocks with syntax highlighting.
- **Icon:** `Code2` · **Color:** `#3b82f6` (blue)
- **Key fields:** `title`, `content` (code body), `language` (e.g. `"typescript"`, `"dockerfile"`), `description`
- **contentType:** `"text"`
- **Example (seed):** *Custom Hooks*, *Compound Component Pattern*, *Next.js Docker Setup*

### 2. prompt
- **Purpose:** AI prompt templates and reusable workflows.
- **Icon:** `Sparkles` · **Color:** `#8b5cf6` (violet)
- **Key fields:** `title`, `content` (prompt body, often with `{{placeholders}}`), `description`
- **contentType:** `"text"`
- **`language` not used.**
- **Example (seed):** *Code Review Prompt*, *Documentation Generator*, *Refactoring Assistant*

### 3. command
- **Purpose:** Terminal / CLI commands, typically one-liners.
- **Icon:** `Terminal` · **Color:** `#f97316` (orange)
- **Key fields:** `title`, `content` (command string), `description`
- **contentType:** `"text"`
- **Example (seed):** *Kill Process on Port* (`lsof -ti tcp:3000 | xargs kill -9`), *Deploy to Production*

### 4. note
- **Purpose:** Markdown-formatted free-text notes.
- **Icon:** `StickyNote` · **Color:** `#fde047` (yellow)
- **Key fields:** `title`, `content` (markdown body), `description`
- **contentType:** `"text"`
- **No seed data yet** — type exists but no seeded examples.

### 5. file *(Pro)*
- **Purpose:** Uploaded files — templates, configs, PDFs, etc.
- **Icon:** `File` · **Color:** `#6b7280` (gray)
- **Key fields:** `fileUrl`, `fileName`, `fileSize`, `title`, `description`
- **contentType:** `"file"`
- Marked as Pro in the sidebar via the `PRO` badge.

### 6. image *(Pro)*
- **Purpose:** Screenshots, diagrams, reference images.
- **Icon:** `Image` · **Color:** `#ec4899` (pink)
- **Key fields:** `fileUrl`, `fileName`, `fileSize`, `title`, `description`
- **contentType:** `"file"`
- Marked as Pro in the sidebar via the `PRO` badge.

### 7. link
- **Purpose:** Saved URLs with metadata.
- **Icon:** `Link` (aliased from `Link` lucide) · **Color:** `#10b981` (emerald)
- **Key fields:** `url`, `title`, `description`
- **contentType:** `"text"` (the seed stores links as text-contentType rows with a populated `url`)
- **Example (seed):** *Neon PostgreSQL Docs*, *Tailwind CSS Docs*, *shadcn/ui*, *Lucide Icons*

---

## Classification: text vs file vs URL

The `Item.contentType` column only distinguishes `"text"` vs `"file"`. Link type is stored as `"text"` with a populated `url`. So the conceptual 3-way split is:

| Group | contentType | Type members          | Primary content source                     |
| ----- | ----------- | --------------------- | ------------------------------------------- |
| text  | `"text"`    | snippet, prompt, command, note | `Item.content` (string / markdown / code) |
| file  | `"file"`    | file, image           | `Item.fileUrl` + `fileName` + `fileSize`    |
| URL   | `"text"`    | link                  | `Item.url` (with `content` empty)           |

Implication: UI components that render an item should branch on `type.name` (or `type.icon`) rather than `contentType` alone, because `"text"` covers both content-bearing items and link items.

---

## Shared Properties

Every item — regardless of type — has these fields on the `Item` model ([prisma/schema.prisma](../prisma/schema.prisma)):

- `id`, `title`, `description`
- `contentType` (`"text"` | `"file"`)
- `isFavorite`, `isPinned` — surface in dashboard sections and sidebar
- `userId` (owner), `typeId` (→ `ItemType`), `collectionId` (optional, nullable, `SetNull` on collection delete)
- `tags` via `ItemTag` join table
- `createdAt`, `updatedAt`
- Optional content fields (populated per type): `content`, `language`, `fileUrl`, `fileName`, `fileSize`, `url`

Cascade/behavior:
- Deleting a user cascades to all their items, types, collections, tags.
- Deleting a collection only nulls `collectionId` on items (items survive).
- Deleting an `ItemType` is **not** cascaded — there is no `onDelete` on `Item.type`, so type deletion requires reassignment (relevant for Pro custom types).

---

## Display Differences

Based on the dashboard/sidebar components ([src/components/dashboard/](../src/components/dashboard/)):

- **Icon + color circle** — each item row and collection card resolves the item's type icon via `typeIconMap` and paints it in `ItemType.color`. This is the primary visual identifier across `ItemRow`, `CollectionsSection`, and the `Sidebar` item-types list.
- **Dominant type color** — collection cards derive their border color from the **most-used** item type inside the collection (see `getCollections` in [src/lib/db/collections.ts](../src/lib/db/collections.ts)).
- **Language badge** — only snippets (and code-bearing items) use `Item.language` for syntax highlighting / language labels.
- **`PRO` badge** — `file` and `image` types show a subtle `PRO` badge next to their name in the sidebar; hidden when the sidebar is collapsed.
- **Sidebar counts** — per-type item counts come from `getSystemItemTypes(userId)` in [src/lib/db/items.ts](../src/lib/db/items.ts).
- **Pinned / Recent sections** — type-agnostic; both use the shared `ItemRow` which auto-resolves the correct icon from the item's nested `type` relation.
- **Link items** — rendered from `Item.url` rather than `Item.content`; currently share the same `ItemRow` layout but semantically click-through to the URL.
- **File / image items** — not yet rendered in the dashboard (Pro feature, file uploads not implemented in MVP); `contentType = "file"` rows would use `fileUrl` for display / download.
