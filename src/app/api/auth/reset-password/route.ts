import { NextResponse } from "next/server"
import { resetPassword } from "@/lib/auth/password-reset"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const ip = await getClientIp()
  const rateLimited = await checkRateLimit("resetPassword", ip)
  if (rateLimited) return rateLimited

  const { token, password } = await req.json()

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token is required" }, { status: 400 })
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    )
  }

  const result = await resetPassword(token, password)

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ message: "Password reset successfully" })
}
