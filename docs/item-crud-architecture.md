# Item CRUD Architecture

A unified CRUD system for all 7 item types (snippet, prompt, command, note, file, image, link — see [docs/item-types.md](item-types.md)). The goal is **one set of mutations, one set of queries, one dynamic route, one shared set of components** — with type-specific behavior pushed to the edges (components + Zod schemas), not into the action layer.

---

## Guiding Principles

1. **One action file for mutations.** Create/update/delete for items is a single concern and lives in [src/actions/items.ts](../src/actions/items.ts). No per-type action files.
2. **Queries go in `lib/db`, not actions.** Server components fetch directly via `lib/db/items.ts`. Actions only run on client-triggered mutations (per [context/coding-standards.md](../context/coding-standards.md)).
3. **One dynamic route** `/items/[type]` for list views plus `/items/[type]/[id]` for the detail/editor view. The sidebar already links to `/items/[slug]`.
4. **Type-specific logic lives in components and schemas**, not in actions. Actions take a discriminated union validated by Zod; the DB layer stays type-agnostic.
5. **Shared form shell, type-aware fields.** A single `ItemForm` component switches its body fields based on the resolved `ItemType.name`.

---

## File Structure

```
src/
├── actions/
│   └── items.ts                # create / update / delete / togglePin / toggleFavorite
├── lib/
│   ├── db/
│   │   └── items.ts            # queries: getItemsByType, getItemById, getPinned, getRecent, ...
│   └── validators/
│       └── item.ts             # Zod discriminated union: ItemInputSchema
├── app/
│   └── (dashboard)/
│       └── items/
│           └── [type]/
│               ├── page.tsx            # list view for one type (snippet, prompt, ...)
│               ├── new/
│               │   └── page.tsx        # new item form for that type
│               └── [id]/
│                   └── page.tsx        # detail / editor view
└── components/
    └── items/
        ├── ItemForm.tsx                # shared form shell (client)
        ├── ItemList.tsx                # list/grid for a type (server)
        ├── ItemCard.tsx                # card renderer — branches on type.name
        ├── ItemActions.tsx             # pin / favorite / delete / copy (client)
        └── fields/
            ├── TextContentField.tsx    # snippet / prompt / command / note
            ├── UrlField.tsx            # link
            └── FileUploadField.tsx     # file / image (Pro)
```

### Why this layout

- **`src/actions/items.ts`** — a single `"use server"` module. Follows the pattern already established by [src/actions/auth.ts](../src/actions/auth.ts).
- **`src/lib/db/items.ts`** — extends the existing file (already exports `getPinnedItems`, `getRecentItems`, `getItemStats`, `getSystemItemTypes`). Add type-scoped queries here.
- **`src/lib/validators/item.ts`** — a Zod discriminated union on `type` is the single place where field requirements diverge (snippet needs `content` + `language`, link needs `url`, file/image need `fileUrl` + `fileName` + `fileSize`). The action calls `ItemInputSchema.parse(input)` once and is done.
- **`src/components/items/`** — shared UI. The only type-aware piece is which `fields/*` component is rendered inside `ItemForm`.

---

## How `/items/[type]` Routing Works

The `[type]` segment is the `ItemType.name` (e.g. `snippet`, `prompt`, `link`). The sidebar already links this way (see previous feature log).

### Route resolution

```
src/app/(dashboard)/items/[type]/page.tsx   →   list of items for that type
src/app/(dashboard)/items/[type]/new/page.tsx  → empty ItemForm, typeId resolved server-side
src/app/(dashboard)/items/[type]/[id]/page.tsx → ItemForm pre-filled with item data
```

### Server-component flow (list page)

```tsx
// src/app/(dashboard)/items/[type]/page.tsx
export default async function ItemsByTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const itemType = await getItemTypeByName(type, session.user.id)  // 404 if not found
  if (!itemType) notFound()

  const items = await getItemsByType(session.user.id, itemType.id)

  return (
    <DashboardShell ...>
      <ItemList type={itemType} items={items} />
    </DashboardShell>
  )
}
```

### Key routing rules

- `params.type` is the **name** (string), not the id. The DB lookup resolves it to an `ItemType` row scoped by `isSystem: true OR userId = session.user.id` (so custom Pro types work automatically).
- Unknown type → `notFound()`.
- All pages are **server components** that fetch directly via `lib/db/items.ts`. No action calls on read.
- Mutations inside these pages (delete, toggle pin) are dispatched from **client** components (`ItemActions`, `ItemForm`) that import from `@/actions/items`.

### Why a single dynamic segment (not 7 hard-coded routes)

- DRY: one `page.tsx` handles all 7 system types **and** any future Pro custom types with zero code changes.
- Consistent URL shape makes sidebar links trivial (`/items/${type.name}`).
- Type-specific rendering is handled *inside* components via a switch on `type.name`, which is cheap and testable.

---

## Where Type-Specific Logic Lives

| Concern                         | Location                                      | Type-aware?      |
| ------------------------------- | --------------------------------------------- | ---------------- |
| Field requirements / validation | `lib/validators/item.ts` (Zod discriminated)  | ✅ single switch |
| Form field rendering            | `components/items/fields/*`                   | ✅ one per group |
| Card rendering (list)           | `components/items/ItemCard.tsx`               | ✅ switch        |
| Mutations (action handlers)     | `actions/items.ts`                            | ❌ generic        |
| DB queries                      | `lib/db/items.ts`                             | ❌ generic        |
| Route / page shells             | `app/(dashboard)/items/[type]/*`              | ❌ generic        |

The action does **not** branch on type beyond calling `ItemInputSchema.parse()`. All divergence is pushed to:

1. **The Zod schema** — decides which fields are required per type.
2. **The form field components** — decides how each type is entered.
3. **The card component** — decides how each type is previewed.

This keeps `actions/items.ts` small (~100 lines) and stable.

---

## Component Responsibilities

### Server components (no `"use client"`)

- **`app/(dashboard)/items/[type]/page.tsx`** — auth check, resolve type by name, fetch items via `getItemsByType`, render `ItemList`.
- **`app/(dashboard)/items/[type]/[id]/page.tsx`** — auth check, fetch single item via `getItemById`, verify ownership, render `ItemForm` pre-filled.
- **`app/(dashboard)/items/[type]/new/page.tsx`** — auth check, resolve type id, render empty `ItemForm` with `typeId` prop.
- **`ItemList`** — renders the grid/list of `ItemCard`s. Reads only; no state.

### Client components (`"use client"`)

- **`ItemForm`** — shared form shell. Props: `{ type: ItemType, item?: Item }`. Handles `useState` for form fields, calls `createItem` or `updateItem` from `@/actions/items`. Internally picks which `fields/*` sub-component to render based on `type.name`:
  - `snippet | prompt | command | note` → `TextContentField` (with optional `language` for snippet)
  - `link` → `UrlField`
  - `file | image` → `FileUploadField` (Pro-gated)
- **`ItemCard`** — click target + per-type preview. Switches on `type.name` for preview body (code block, markdown excerpt, URL favicon, file chip, etc.) but shares title/description/tags/date layout.
- **`ItemActions`** — dropdown with Pin, Favorite, Delete, Copy. Calls `togglePin`, `toggleFavorite`, `deleteItem` from `@/actions/items`. Generic — no type branching.
- **`fields/TextContentField`** — markdown / code editor + `language` selector (snippet only).
- **`fields/UrlField`** — URL input with metadata preview.
- **`fields/FileUploadField`** — upload widget that writes `fileUrl` + `fileName` + `fileSize` (Pro).

---

## Mutations: `src/actions/items.ts`

A single `"use server"` module. Every action:

1. Calls `auth()` and rejects if no session.
2. Parses input with a Zod schema (discriminated union for create/update).
3. Runs the Prisma mutation scoped to `userId: session.user.id`.
4. Calls `revalidatePath` for the affected routes.
5. Returns the standard `{ success, data?, error? }` shape ([context/coding-standards.md](../context/coding-standards.md)).

Exported functions:

```ts
createItem(input: ItemInput): Promise<ActionResult<Item>>
updateItem(id: string, input: ItemInput): Promise<ActionResult<Item>>
deleteItem(id: string): Promise<ActionResult<void>>
togglePin(id: string): Promise<ActionResult<{ isPinned: boolean }>>
toggleFavorite(id: string): Promise<ActionResult<{ isFavorite: boolean }>>
```

`ItemInput` is a Zod discriminated union on `typeName`:

```ts
// src/lib/validators/item.ts
const base = { title: z.string().min(1), description: z.string().optional(), collectionId: z.string().optional(), tagNames: z.array(z.string()).optional() }

export const ItemInputSchema = z.discriminatedUnion('typeName', [
  z.object({ typeName: z.literal('snippet'),  content: z.string().min(1), language: z.string().optional(), ...base }),
  z.object({ typeName: z.literal('prompt'),   content: z.string().min(1), ...base }),
  z.object({ typeName: z.literal('command'),  content: z.string().min(1), ...base }),
  z.object({ typeName: z.literal('note'),     content: z.string().min(1), ...base }),
  z.object({ typeName: z.literal('link'),     url: z.string().url(), ...base }),
  z.object({ typeName: z.literal('file'),     fileUrl: z.string().url(), fileName: z.string(), fileSize: z.number(), ...base }),
  z.object({ typeName: z.literal('image'),    fileUrl: z.string().url(), fileName: z.string(), fileSize: z.number(), ...base }),
])
```

The action translates `typeName` → `typeId` with a single `prisma.itemType.findFirst({ where: { name, OR: [{ isSystem: true }, { userId }] } })` lookup, then writes the row. `contentType` is derived from `typeName` (`file | image` → `"file"`, everything else → `"text"`).

Tags are handled generically via an upsert loop (matches the pattern in [prisma/seed.ts](../prisma/seed.ts)).

---

## Queries: `src/lib/db/items.ts`

Extend the existing file with:

```ts
getItemTypeByName(name: string, userId: string): Promise<ItemType | null>
getItemsByType(userId: string, typeId: string, opts?: { search?: string; collectionId?: string }): Promise<ItemWithMeta[]>
getItemById(userId: string, id: string): Promise<ItemDetail | null>   // ownership-scoped
```

Existing functions (`getPinnedItems`, `getRecentItems`, `getItemStats`, `getSystemItemTypes`) stay as-is. All queries remain type-agnostic — they include the `type` relation and return it; UI decides how to render.

---

## Summary of Responsibilities

| Layer                    | Knows about types? | Files                                         |
| ------------------------ | ------------------ | --------------------------------------------- |
| Route (page.tsx)         | No                 | `app/(dashboard)/items/[type]/**`             |
| Action layer             | No (Zod does)      | `actions/items.ts`                            |
| Validator                | **Yes**            | `lib/validators/item.ts`                      |
| DB query layer           | No                 | `lib/db/items.ts`                             |
| Form shell               | No                 | `components/items/ItemForm.tsx`               |
| Form fields              | **Yes**            | `components/items/fields/*`                   |
| Card / preview           | **Yes**            | `components/items/ItemCard.tsx`               |
| Generic actions UI       | No                 | `components/items/ItemActions.tsx`            |

Net effect: adding a new (Pro custom) item type requires **zero** action or route changes — only a new entry in the Zod schema and a new field component if its input shape is novel. System types already use the generic text/url/file field groups.
