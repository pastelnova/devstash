import NextAuth, { CredentialsSignin } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import authConfig from "./auth.config"

class EmailNotVerifiedError extends CredentialsSignin {
  code = "EMAIL_NOT_VERIFIED"
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
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

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return null

        if (!user.emailVerified) {
          throw new EmailNotVerifiedError()
        }

        return { id: user.id, name: user.name, email: user.email, image: user.image }
      },
    }),
  ],
})
