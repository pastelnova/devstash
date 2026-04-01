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
  console.log(`✓ System item types (${itemTypes.length}):`)
  for (const t of itemTypes) {
    console.log(`    - ${t.name} (${t.icon}, ${t.color})`)
  }

  // 3. Row counts
  const [users, items, collections, tags] = await Promise.all([
    prisma.user.count(),
    prisma.item.count(),
    prisma.collection.count(),
    prisma.tag.count(),
  ])
  console.log("\n✓ Row counts:")
  console.log(`    users: ${users}`)
  console.log(`    items: ${items}`)
  console.log(`    collections: ${collections}`)
  console.log(`    tags: ${tags}`)

  console.log("\nAll checks passed.")
}

main()
  .catch((e) => {
    console.error("Database test failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
