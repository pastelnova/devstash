import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import GitHub from "next-auth/providers/github"

// Edge-compatible config — no Prisma imports here.
// Used by proxy.ts (runs on edge runtime) and re-exported by auth.ts.
// Credentials authorize is a placeholder — overridden in auth.ts with bcrypt validation.

export default {
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: () => null,
    }),
  ],
} satisfies NextAuthConfig
