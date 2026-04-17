import NextAuth, { CredentialsSignin } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { rateLimiters, getClientIp } from "@/lib/rate-limit"
import authConfig from "./auth.config"

class EmailNotVerifiedError extends CredentialsSignin {
  code = "EMAIL_NOT_VERIFIED"
}

class RateLimitError extends CredentialsSignin {
  code = "RATE_LIMITED"
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      // Always sync isPro from DB so webhook updates are reflected on next request
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isPro: true },
        })
        if (!dbUser) {
          // User was deleted — invalidate the token so the session ends
          return { ...token, id: undefined }
        }
        token.isPro = dbUser.isPro
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
        session.user.isPro = token.isPro ?? false
      }
      return session
    },
  },
  ...authConfig,
  providers: [
    ...authConfig.providers.filter(
      (p) => (p as { id?: string }).id !== "credentials"
    ),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) return null

        const normalizedEmail = email.toLowerCase().trim()

        // Rate limit by IP + email
        const limiter = rateLimiters.login
        if (limiter) {
          try {
            const ip = await getClientIp()
            const identifier = `${ip}:${normalizedEmail}`
            const { success } = await limiter.limit(identifier)
            if (!success) throw new RateLimitError()
          } catch (e) {
            if (e instanceof RateLimitError) throw e
            // Fail open if Upstash is down
          }
        }

        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return null

        if (
          process.env.REQUIRE_EMAIL_VERIFICATION === "true" &&
          !user.emailVerified
        ) {
          throw new EmailNotVerifiedError()
        }

        return { id: user.id, name: user.name, email: user.email, image: user.image }
      },
    }),
  ],
})
