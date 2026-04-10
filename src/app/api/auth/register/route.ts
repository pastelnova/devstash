import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { generateVerificationToken, sendVerificationEmail } from "@/lib/auth/verification"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

const requireEmailVerification =
  process.env.REQUIRE_EMAIL_VERIFICATION === "true"

export async function POST(req: Request) {
  const ip = await getClientIp()
  const rateLimited = await checkRateLimit("register", ip)
  if (rateLimited) return rateLimited

  const body = await req.json()
  const { name, email, password, confirmPassword } = body as {
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
  }

  if (!name || !email || !password || !confirmPassword) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    )
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "Passwords do not match" },
      { status: 400 }
    )
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    )
  }

  const normalizedEmail = email.toLowerCase().trim()

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existingUser) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409 }
    )
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      emailVerified: requireEmailVerification ? null : new Date(),
    },
  })

  if (requireEmailVerification) {
    const token = await generateVerificationToken(normalizedEmail)
    await sendVerificationEmail(normalizedEmail, token)
  }

  return NextResponse.json(
    {
      success: true,
      message: requireEmailVerification
        ? "Verification email sent"
        : "Account created",
    },
    { status: 201 }
  )
}
