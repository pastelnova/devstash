import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Testing database connection...\n")

  // 1. Raw connection check
  const result = await prisma.$queryRaw<[{ now: Date }]>`SELECT NOW()`
  console.log("✓ Connected to database at:", result[0].now)

  // 2. Check system item types
  const itemTypes = await prisma.itemType.findMany({ where: { isSystem: true } })
  console.log(`\n✓ System item types (${itemTypes.length}):`)
  for (const t of itemTypes) {
    console.log(`    - ${t.name} (${t.icon}, ${t.color})`)
  }

  // 3. Demo user
  const user = await prisma.user.findUnique({
    where: { email: "demo@devstash.io" },
    select: { id: true, name: true, email: true, isPro: true, emailVerified: true },
  })
  if (!user) throw new Error("Demo user not found — run `npm run db:seed` first")
  console.log(`\n✓ Demo user: ${user.name} <${user.email}> (isPro: ${user.isPro}, verified: ${!!user.emailVerified})`)

  // 4. Collections
  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    include: { _count: { select: { items: true } } },
    orderBy: { name: "asc" },
  })
  console.log(`\n✓ Collections (${collections.length}):`)
  for (const c of collections) {
    const star = c.isFavorite ? "★" : " "
    console.log(`    ${star} ${c.name} — ${c._count.items} items`)
  }

  // 5. Items by type
  const itemsByType = await prisma.item.groupBy({
    by: ["typeId"],
    where: { userId: user.id },
    _count: { _all: true },
  })
  const typeMap = Object.fromEntries(itemTypes.map((t) => [t.id, t.name]))
  console.log(`\n✓ Items by type:`)
  for (const row of itemsByType) {
    console.log(`    - ${typeMap[row.typeId] ?? row.typeId}: ${row._count._all}`)
  }

  // 6. Pinned & favorite items
  const pinned = await prisma.item.findMany({
    where: { userId: user.id, isPinned: true },
    select: { title: true },
  })
  const favorites = await prisma.item.findMany({
    where: { userId: user.id, isFavorite: true },
    select: { title: true },
  })
  console.log(`\n✓ Pinned items (${pinned.length}): ${pinned.map((i) => i.title).join(", ")}`)
  console.log(`✓ Favorite items (${favorites.length}): ${favorites.map((i) => i.title).join(", ")}`)

  // 7. Tags
  const tags = await prisma.tag.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } })
  console.log(`\n✓ Tags (${tags.length}): ${tags.map((t) => t.name).join(", ")}`)

  // 8. Row counts
  const [userCount, itemCount, collectionCount, tagCount] = await Promise.all([
    prisma.user.count(),
    prisma.item.count(),
    prisma.collection.count(),
    prisma.tag.count(),
  ])
  console.log("\n✓ Total row counts:")
  console.log(`    users: ${userCount}`)
  console.log(`    items: ${itemCount}`)
  console.log(`    collections: ${collectionCount}`)
  console.log(`    tags: ${tagCount}`)

  console.log("\nAll checks passed.")
}

main()
  .catch((e) => {
    console.error("Database test failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
