import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generatePasswordResetToken, sendPasswordResetEmail } from "@/lib/auth/password-reset"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const ip = await getClientIp()
  const rateLimited = await checkRateLimit("forgotPassword", ip)
  if (rateLimited) return rateLimited

  const { email } = await req.json()

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  // Always return success to prevent email enumeration
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  })

  if (user && user.password) {
    const token = await generatePasswordResetToken(user.email)
    await sendPasswordResetEmail(user.email, token)
  }

  return NextResponse.json({
    message: "If an account with that email exists, a reset link has been sent.",
  })
}
