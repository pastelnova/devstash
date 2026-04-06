import authConfig from "./auth.config"
import NextAuth from "next-auth"

const { auth } = NextAuth(authConfig)

export const proxy = auth(async (req) => {
  const isLoggedIn = !!req.auth

  const isProtected = req.nextUrl.pathname.startsWith("/dashboard")

  if (isProtected && !isLoggedIn) {
    return Response.redirect(new URL("/api/auth/signin", req.nextUrl.origin))
  }
})
