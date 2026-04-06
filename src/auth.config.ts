import type { NextAuthConfig } from "next-auth"
import GitHub from "next-auth/providers/github"

// Edge-compatible config — no Prisma imports here.
// Used by proxy.ts (runs on edge runtime) and re-exported by auth.ts.

export default {
  providers: [GitHub],
} satisfies NextAuthConfig
