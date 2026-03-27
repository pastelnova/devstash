# 🗃️ DevStash — Project Overview

> **Store Smarter. Build Faster.**
> A centralized, AI-enhanced knowledge hub for developers — snippets, prompts, commands, docs & more.

---

## 📌 The Problem

Developers scatter their essentials across too many places:

| Where it lives | What's stored |
|---|---|
| VS Code / Notion | Code snippets |
| AI chat history | Prompts & workflows |
| Project folders | Context files |
| Browser bookmarks | Useful links |
| Random folders | Docs & references |
| `.txt` files | Terminal commands |
| GitHub Gists | Project templates |
| Bash history | One-off commands |

**Result:** Context switching, lost knowledge, and inconsistent workflows.

**DevStash** provides one searchable, AI-enhanced hub for all dev knowledge.

---

## 👥 Target Users

| Persona | Core Need |
|---|---|
| 🧑‍💻 Everyday Developer | Quick access to snippets, commands, and links |
| 🤖 AI-First Developer | Store prompts, workflows, and context files |
| 🎓 Content Creator / Educator | Save course notes and reusable code examples |
| 🏗️ Full-Stack Builder | Patterns, boilerplates, and API references |

---

## ✨ Core Features

### A) Item Types

Items are the core unit of DevStash. Each item has a built-in system type:

| Type | Description |
|---|---|
| `Snippet` | Reusable code blocks with syntax highlighting |
| `Prompt` | AI prompt templates and workflows |
| `Note` | Markdown-formatted free-text notes |
| `Command` | Terminal / CLI commands |
| `File` | Uploaded files (templates, configs, etc.) |
| `Image` | Screenshots, diagrams, reference images |
| `URL` | Saved links with metadata |

> 💡 **Pro users** can create custom item types.

### B) Collections

Group any mix of item types into named collections:

- `React Patterns`
- `Context Files`
- `Python Snippets`
- `Deployment Runbooks`

### C) Search

Full-text search across content, tags, titles, and types. All items are immediately searchable after creation.

### D) Authentication

- Email + Password
- GitHub OAuth (via NextAuth v5)

### E) Additional Features

- ⭐ Favorites & 📌 pinned items
- 🕐 Recently used feed
- 📥 Import from files
- ✏️ Markdown editor for text items
- 📁 File uploads (images, docs, templates)
- 📤 Export (JSON / ZIP)
- 🌑 Dark mode (default)

### F) AI Superpowers *(Pro)*

| Feature | Description |
|---|---|
| 🏷️ Auto-tagging | Suggests relevant tags based on content |
| 📝 AI Summary | One-liner summary for any item |
| 💡 Explain Code | Plain-English code explanations |
| ✨ Prompt Optimization | Refines and improves AI prompts |

> Powered by **OpenAI `gpt-4o-mini`** (fast, cost-effective)

---

## 💰 Monetization

| Plan | Price | Item Limit | Collections | Features |
|---|---|---|---|---|
| **Free** | $0 | 50 items | 3 | Basic search, image uploads, no AI |
| **Pro** | $8/mo or $72/yr | Unlimited | Unlimited | File uploads, custom types, AI features, export |

> Billing via **Stripe** — subscriptions + webhooks for real-time plan sync.

---

## 🗄️ Data Model

> This schema is a starting point and will evolve throughout development.

```prisma
model User {
  id                   String       @id @default(cuid())
  email                String       @unique
  password             String?
  isPro                Boolean      @default(false)
  stripeCustomerId     String?
  stripeSubscriptionId String?
  items                Item[]
  itemTypes            ItemType[]
  collections          Collection[]
  tags                 Tag[]
  createdAt            DateTime     @default(now())
  updatedAt            DateTime     @updatedAt
}

model Item {
  id           String      @id @default(cuid())
  title        String
  contentType  String      // "text" | "file"
  content      String?     // used for text-based types
  fileUrl      String?
  fileName     String?
  fileSize     Int?
  url          String?
  description  String?
  isFavorite   Boolean     @default(false)
  isPinned     Boolean     @default(false)
  language     String?     // for code snippets (e.g. "typescript")

  userId       String
  user         User        @relation(fields: [userId], references: [id])

  typeId       String
  type         ItemType    @relation(fields: [typeId], references: [id])

  collectionId String?
  collection   Collection? @relation(fields: [collectionId], references: [id])

  tags         ItemTag[]

  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

model ItemType {
  id       String  @id @default(cuid())
  name     String
  icon     String?
  color    String?
  isSystem Boolean @default(false) // false = user-created (Pro only)

  userId   String?
  user     User?   @relation(fields: [userId], references: [id])

  items    Item[]
}

model Collection {
  id          String   @id @default(cuid())
  name        String
  description String?
  isFavorite  Boolean  @default(false)

  userId      String
  user        User     @relation(fields: [userId], references: [id])

  items       Item[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Tag {
  id     String    @id @default(cuid())
  name   String
  userId String
  user   User      @relation(fields: [userId], references: [id])
  items  ItemTag[]
}

model ItemTag {
  itemId String
  tagId  String
  item   Item   @relation(fields: [itemId], references: [id])
  tag    Tag    @relation(fields: [tagId], references: [id])

  @@id([itemId, tagId])
}
```

---

## 🧱 Tech Stack

| Category | Choice | Notes |
|---|---|---|
| Framework | [Next.js](https://nextjs.org/) (React 19) | App Router, Server Components |
| Language | TypeScript | Strict mode recommended |
| Database | [Neon PostgreSQL](https://neon.tech/) + [Prisma ORM](https://www.prisma.io/) | Serverless-friendly Postgres |
| Caching | [Redis](https://redis.io/) | Optional — rate limiting, sessions |
| File Storage | [Cloudflare R2](https://developers.cloudflare.com/r2/) | S3-compatible, no egress fees |
| CSS / UI | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) | Dark mode default |
| Auth | [NextAuth v5](https://authjs.dev/) | Email + GitHub OAuth |
| AI | [OpenAI API](https://platform.openai.com/) | `gpt-4o-mini` |
| Payments | [Stripe](https://stripe.com/) | Subscriptions + webhooks |
| Deployment | [Vercel](https://vercel.com/) | Edge-ready, CI/CD built-in |
| Monitoring | [Sentry](https://sentry.io/) | Runtime errors (Phase 2) |

---

## 🔌 API Architecture

```
┌──────────┐        ┌─────────────┐        ┌────────────────┐
│  Client  │◄──────►│  Next.js    │◄──────►│  Neon Postgres │
│ (React)  │        │  API Routes │        └────────────────┘
└──────────┘        │             │
                    │             │◄──────►│  Cloudflare R2 │
                    │             │        └────────────────┘
                    │             │
                    │             │◄──────►│  OpenAI API    │
                    │             │        └────────────────┘
                    │             │
                    │             │◄──────►│  Redis Cache   │
                    └─────────────┘        └────────────────┘
```

---

## 🔐 Auth Flow

```
User
 │
 ▼
Login Page
 │
 ▼
NextAuth v5
 ├── Email + Password ──► Session ──► App Access
 └── GitHub OAuth ──────► Session ──► App Access
```

---

## 🧠 AI Feature Flow

```
Item Content
 │
 ▼
/api/ai (Next.js Route)
 │
 ▼
OpenAI gpt-4o-mini
 │
 ├── Auto-tags
 ├── Summary
 ├── Code Explanation
 └── Prompt Optimization
       │
       ▼
   UI Update
```

---

## 🎨 UI / UX

**Design philosophy:** Dark-first, minimal, developer-focused. Inspired by [Notion](https://notion.so), [Linear](https://linear.app), and [Raycast](https://raycast.com).

### Layout

- **Collapsible sidebar** — filters, collections, item types
- **Main workspace** — grid or list view with sorting/filtering
- **Full-screen editor** — for creating and editing items
- **Command palette** *(stretch)* — keyboard-first quick access

### Code Display

- Syntax highlighting for all major languages
- Language badge on snippet cards
- Copy-to-clipboard on all code blocks

### Responsive

- Mobile drawer for sidebar navigation
- Touch-optimized icon sizing and button targets

---

## 🗂️ Development Workflow

This project is structured for a course — **one branch per lesson** so students can follow along and compare.

```bash
# Branch naming convention
git switch -c lesson-01-project-setup
git switch -c lesson-02-database-schema
git switch -c lesson-03-auth
git switch -c lesson-04-items-crud
# ...and so on
```

**Tooling:** Cursor, Claude Code, or ChatGPT for AI-assisted development.
**CI:** GitHub Actions (optional, Phase 2).
**Error tracking:** Sentry (Phase 2).

---

## 🧭 Roadmap

### Phase 1 — MVP (Free Tier)
- [ ] Project setup & environment
- [ ] Auth (email + GitHub)
- [ ] Items CRUD (text types)
- [ ] Collections
- [ ] Full-text search
- [ ] Basic tagging
- [ ] Free tier limits enforcement (50 items, 3 collections)
- [ ] Dark mode UI

### Phase 2 — Pro Tier
- [ ] Stripe billing + upgrade flow
- [ ] AI features (auto-tag, summary, explain, optimize)
- [ ] Custom item types
- [ ] File uploads (Cloudflare R2)
- [ ] Export (JSON / ZIP)
- [ ] Sentry monitoring

### Phase 3 — Future
- [ ] Shared collections
- [ ] Team / Org plans
- [ ] VS Code extension
- [ ] Browser extension (save links / snippets on the fly)
- [ ] Public API + CLI tool

---

## 📁 Suggested Project Structure

```
devstash/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── items/
│   │   ├── collections/
│   │   └── settings/
│   └── api/
│       ├── items/
│       ├── collections/
│       ├── tags/
│       └── ai/
├── components/
│   ├── items/
│   ├── collections/
│   ├── editor/
│   └── ui/           # shadcn components
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   └── openai.ts
├── prisma/
│   └── schema.prisma
└── public/
```

---

## 📌 Status

🟡 **In Planning** — environment setup and UI scaffolding is next.

---

*DevStash — Store Smarter. Build Faster.*
