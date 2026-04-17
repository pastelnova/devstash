import "dotenv/config"
import bcrypt from "bcryptjs"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const SYSTEM_ITEM_TYPES = [
  { id: "system-snippet", name: "snippet", icon: "Code", color: "#3b82f6" },
  { id: "system-prompt", name: "prompt", icon: "Sparkles", color: "#8b5cf6" },
  { id: "system-command", name: "command", icon: "Terminal", color: "#f97316" },
  { id: "system-note", name: "note", icon: "StickyNote", color: "#fde047" },
  { id: "system-file", name: "file", icon: "File", color: "#6b7280" },
  { id: "system-image", name: "image", icon: "Image", color: "#ec4899" },
  { id: "system-link", name: "link", icon: "Link", color: "#10b981" },
]

async function main() {
  console.log("Seeding...")

  // ── System item types ────────────────────────────────────────────────────────
  for (const type of SYSTEM_ITEM_TYPES) {
    await prisma.itemType.upsert({
      where: { id: type.id },
      update: { name: type.name, icon: type.icon, color: type.color },
      create: { ...type, isSystem: true, userId: null },
    })
  }
  console.log("✓ System item types")

  // ── Demo user ────────────────────────────────────────────────────────────────
  const password = await bcrypt.hash("12345678", 12)
  const user = await prisma.user.upsert({
    where: { email: "demo@devstash.io" },
    update: {},
    create: {
      email: "demo@devstash.io",
      name: "Demo User",
      password,
      isPro: false,
      emailVerified: new Date(),
    },
  })
  console.log("✓ Demo user")

  // ── Tags ─────────────────────────────────────────────────────────────────────
  const tagNames = [
    "react",
    "typescript",
    "hooks",
    "patterns",
    "ai",
    "prompts",
    "devops",
    "docker",
    "ci-cd",
    "git",
    "cli",
    "shell",
    "design",
    "css",
    "tailwind",
    "ui",
    "deployment",
  ]
  const tags: Record<string, string> = {}
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { name_userId: { name, userId: user.id } },
      update: {},
      create: { name, userId: user.id },
    })
    tags[name] = tag.id
  }
  console.log("✓ Tags")

  // ── Helper ───────────────────────────────────────────────────────────────────
  async function createItem(data: {
    title: string
    contentType: string
    content?: string
    url?: string
    description?: string
    language?: string
    isFavorite?: boolean
    isPinned?: boolean
    typeId: string
    collectionId: string
    tagNames: string[]
  }) {
    const { tagNames: itemTags, collectionId, ...rest } = data
    const item = await prisma.item.create({
      data: { ...rest, userId: user.id },
    })
    for (const name of itemTags) {
      if (tags[name]) {
        await prisma.itemTag.create({ data: { itemId: item.id, tagId: tags[name] } })
      }
    }
    if (collectionId) {
      await prisma.collectionItem.create({ data: { itemId: item.id, collectionId } })
    }
    return item
  }

  // ── React Patterns ───────────────────────────────────────────────────────────
  const reactPatterns = await prisma.collection.upsert({
    where: { id: "seed-collection-react-patterns" },
    update: {},
    create: {
      id: "seed-collection-react-patterns",
      name: "React Patterns",
      description: "Reusable React patterns and hooks",
      isFavorite: true,
      userId: user.id,
    },
  })

  await createItem({
    title: "Custom Hooks",
    contentType: "text",
    language: "typescript",
    description: "useDebounce, useLocalStorage, and other utility hooks",
    content: `import { useState, useEffect, useRef } from "react"

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })
  const setValue = (value: T) => {
    setStored(value)
    window.localStorage.setItem(key, JSON.stringify(value))
  }
  return [stored, setValue] as const
}

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()
  useEffect(() => { ref.current = value })
  return ref.current
}`,
    isFavorite: true,
    isPinned: true,
    typeId: "system-snippet",
    collectionId: reactPatterns.id,
    tagNames: ["react", "typescript", "hooks"],
  })

  await createItem({
    title: "Compound Component Pattern",
    contentType: "text",
    language: "typescript",
    description: "Context-based compound components for flexible UI composition",
    content: `import { createContext, useContext, useState } from "react"

interface AccordionContextValue {
  openItem: string | null
  toggle: (id: string) => void
}

const AccordionContext = createContext<AccordionContextValue | null>(null)

function useAccordion() {
  const ctx = useContext(AccordionContext)
  if (!ctx) throw new Error("Must be used inside <Accordion>")
  return ctx
}

export function Accordion({ children }: { children: React.ReactNode }) {
  const [openItem, setOpenItem] = useState<string | null>(null)
  const toggle = (id: string) => setOpenItem((prev) => (prev === id ? null : id))
  return (
    <AccordionContext.Provider value={{ openItem, toggle }}>
      <div>{children}</div>
    </AccordionContext.Provider>
  )
}

Accordion.Item = function Item({ id, children }: { id: string; children: React.ReactNode }) {
  const { openItem, toggle } = useAccordion()
  return (
    <div>
      <button onClick={() => toggle(id)}>{id}</button>
      {openItem === id && <div>{children}</div>}
    </div>
  )
}`,
    typeId: "system-snippet",
    collectionId: reactPatterns.id,
    tagNames: ["react", "typescript", "patterns"],
  })

  await createItem({
    title: "Utility Functions",
    contentType: "text",
    language: "typescript",
    description: "Common TypeScript utility functions for everyday use",
    content: `export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ")
}

export function formatDate(date: Date | string, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(date))
}

export function truncate(str: string, maxLength: number): string {
  return str.length <= maxLength ? str : str.slice(0, maxLength - 3) + "..."
}

export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const group = String(item[key])
    acc[group] = acc[group] ?? []
    acc[group].push(item)
    return acc
  }, {})
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}`,
    typeId: "system-snippet",
    collectionId: reactPatterns.id,
    tagNames: ["typescript", "patterns"],
  })

  console.log("✓ React Patterns collection")

  // ── AI Workflows ─────────────────────────────────────────────────────────────
  const aiWorkflows = await prisma.collection.upsert({
    where: { id: "seed-collection-ai-workflows" },
    update: {},
    create: {
      id: "seed-collection-ai-workflows",
      name: "AI Workflows",
      description: "AI prompts and workflow automations",
      isFavorite: true,
      userId: user.id,
    },
  })

  await createItem({
    title: "Code Review Prompt",
    contentType: "text",
    description: "Thorough code review prompt for pull requests",
    content: `Review the following code and provide feedback on:

1. **Correctness** — Are there any bugs, edge cases, or logic errors?
2. **Security** — Any vulnerabilities (injection, auth, data exposure)?
3. **Performance** — Unnecessary re-renders, N+1 queries, or inefficient algorithms?
4. **Readability** — Is the code clear and self-documenting?
5. **Patterns** — Does it follow existing conventions in the codebase?

Format your response as:
- 🔴 Critical issues (must fix)
- 🟡 Suggestions (should fix)
- 🟢 Positives (what's done well)

Code to review:
\`\`\`
{{code}}
\`\`\``,
    isFavorite: true,
    typeId: "system-prompt",
    collectionId: aiWorkflows.id,
    tagNames: ["ai", "prompts"],
  })

  await createItem({
    title: "Documentation Generator",
    contentType: "text",
    description: "Generate JSDoc/TSDoc documentation for functions and modules",
    content: `Generate comprehensive documentation for the following code.

Include:
- A one-line summary
- Parameter descriptions with types
- Return value description
- Usage example
- Any important notes or edge cases

Use JSDoc format. Be concise but complete.

Code:
\`\`\`typescript
{{code}}
\`\`\``,
    typeId: "system-prompt",
    collectionId: aiWorkflows.id,
    tagNames: ["ai", "prompts"],
  })

  await createItem({
    title: "Refactoring Assistant",
    contentType: "text",
    description: "Prompt for improving code quality and structure",
    content: `Refactor the following code to improve its quality. Focus on:

- Reducing complexity and nesting
- Extracting reusable functions or components
- Improving naming for clarity
- Removing duplication
- Applying relevant design patterns

Constraints:
- Do NOT change external behavior or interfaces
- Keep the same language and framework
- Explain each significant change you make

Original code:
\`\`\`
{{code}}
\`\`\``,
    typeId: "system-prompt",
    collectionId: aiWorkflows.id,
    tagNames: ["ai", "prompts"],
  })

  console.log("✓ AI Workflows collection")

  // ── DevOps ───────────────────────────────────────────────────────────────────
  const devops = await prisma.collection.upsert({
    where: { id: "seed-collection-devops" },
    update: {},
    create: {
      id: "seed-collection-devops",
      name: "DevOps",
      description: "Infrastructure and deployment resources",
      userId: user.id,
    },
  })

  await createItem({
    title: "Next.js Docker Setup",
    contentType: "text",
    language: "dockerfile",
    description: "Multi-stage Dockerfile for Next.js with standalone output",
    content: `FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]`,
    typeId: "system-snippet",
    collectionId: devops.id,
    tagNames: ["devops", "docker"],
  })

  await createItem({
    title: "Deploy to Production",
    contentType: "text",
    description: "Full deploy sequence: migrate, build, restart",
    content: `prisma migrate deploy && npm run build && pm2 restart devstash`,
    typeId: "system-command",
    collectionId: devops.id,
    tagNames: ["devops", "deployment", "cli"],
  })

  await createItem({
    title: "Neon PostgreSQL Docs",
    contentType: "text",
    url: "https://neon.tech/docs/introduction",
    description: "Official Neon serverless Postgres documentation",
    typeId: "system-link",
    collectionId: devops.id,
    tagNames: ["devops"],
  })

  await createItem({
    title: "GitHub Actions Docs",
    contentType: "text",
    url: "https://docs.github.com/en/actions",
    description: "GitHub Actions documentation for CI/CD workflows",
    typeId: "system-link",
    collectionId: devops.id,
    tagNames: ["devops", "ci-cd"],
  })

  console.log("✓ DevOps collection")

  // ── Standalone Commands (no collection) ──────────────────────────────────────
  await createItem({
    title: "Git: Undo Last Commit",
    contentType: "text",
    description: "Undo the last commit while keeping changes staged",
    content: `git reset --soft HEAD~1`,
    typeId: "system-command",
    collectionId: "",
    tagNames: ["git", "cli"],
  })

  await createItem({
    title: "Docker: Clean Up Everything",
    contentType: "text",
    description: "Remove all stopped containers, unused images, networks, and build cache",
    content: `docker system prune -af --volumes`,
    typeId: "system-command",
    collectionId: "",
    tagNames: ["docker", "cli"],
  })

  await createItem({
    title: "Kill Process on Port",
    contentType: "text",
    description: "Find and kill whatever is running on a given port",
    content: `lsof -ti tcp:3000 | xargs kill -9`,
    isPinned: true,
    typeId: "system-command",
    collectionId: "",
    tagNames: ["shell", "cli"],
  })

  await createItem({
    title: "npm: Interactive Upgrade",
    contentType: "text",
    description: "Interactively upgrade outdated packages with npx npm-check",
    content: `npx npm-check -u`,
    typeId: "system-command",
    collectionId: "",
    tagNames: ["cli"],
  })

  console.log("✓ Standalone commands")

  // ── Standalone Links (no collection) ──────────────────────────────────────────
  await createItem({
    title: "Tailwind CSS Docs",
    contentType: "text",
    url: "https://tailwindcss.com/docs",
    description: "Official Tailwind CSS v4 documentation",
    typeId: "system-link",
    collectionId: "",
    tagNames: ["design", "css", "tailwind"],
  })

  await createItem({
    title: "shadcn/ui",
    contentType: "text",
    url: "https://ui.shadcn.com/docs/components",
    description: "Beautifully designed components built with Radix UI and Tailwind",
    isFavorite: true,
    typeId: "system-link",
    collectionId: "",
    tagNames: ["design", "ui"],
  })

  await createItem({
    title: "Radix UI Primitives",
    contentType: "text",
    url: "https://www.radix-ui.com/primitives/docs/overview/introduction",
    description: "Accessible, unstyled UI component primitives for React",
    typeId: "system-link",
    collectionId: "",
    tagNames: ["design", "ui"],
  })

  await createItem({
    title: "Lucide Icons",
    contentType: "text",
    url: "https://lucide.dev/icons/",
    description: "Open-source icon library — search and copy as React components",
    typeId: "system-link",
    collectionId: "",
    tagNames: ["design", "ui"],
  })

  console.log("✓ Standalone links")

  console.log("\nSeed complete.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
