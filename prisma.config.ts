import "dotenv/config"
import { defineConfig, env } from "prisma/config"

// Prisma 7: datasource URL is configured here instead of in schema.prisma.
// This file is used by the Prisma CLI for migrations (prisma migrate dev/deploy).
// Note: Use a direct (non-pooler) Neon URL here for migrations.

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
})
