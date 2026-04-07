import "dotenv/config"
import { prisma } from "../src/lib/prisma"

const KEEP_EMAIL = "demo@devstash.io"

async function main() {
  const usersToDelete = await prisma.user.findMany({
    where: { email: { not: KEEP_EMAIL } },
    select: { id: true, email: true },
  })

  if (usersToDelete.length === 0) {
    console.log("No users to delete — only the demo user exists.")
    return
  }

  console.log(`Deleting ${usersToDelete.length} user(s):`)
  for (const u of usersToDelete) {
    console.log(`  - ${u.email} (${u.id})`)
  }

  const userIds = usersToDelete.map((u) => u.id)

  // Cascade handles most relations, but delete in safe order just in case
  await prisma.session.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.account.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })

  console.log("Done.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
