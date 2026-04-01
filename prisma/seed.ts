import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const SYSTEM_ITEM_TYPES = [
  { name: "Snippet", icon: "Code2", color: "#3b82f6" },
  { name: "Prompt", icon: "Sparkles", color: "#a855f7" },
  { name: "Note", icon: "FileText", color: "#22c55e" },
  { name: "Command", icon: "Terminal", color: "#f97316" },
  { name: "File", icon: "Paperclip", color: "#64748b" },
  { name: "Image", icon: "Image", color: "#ec4899" },
  { name: "URL", icon: "Link", color: "#06b6d4" },
]

async function main() {
  console.log("Seeding system item types...")

  for (const type of SYSTEM_ITEM_TYPES) {
    await prisma.itemType.upsert({
      where: { id: `system-${type.name.toLowerCase()}` },
      update: { name: type.name, icon: type.icon, color: type.color },
      create: {
        id: `system-${type.name.toLowerCase()}`,
        name: type.name,
        icon: type.icon,
        color: type.color,
        isSystem: true,
        userId: null,
      },
    })
    console.log(`  ✓ ${type.name}`)
  }

  console.log("Seed complete.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
