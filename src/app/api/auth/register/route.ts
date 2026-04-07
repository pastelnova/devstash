import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { generateVerificationToken, sendVerificationEmail } from "@/lib/auth/verification"

const requireEmailVerification =
  process.env.REQUIRE_EMAIL_VERIFICATION === "true"

export async function POST(req: Request) {
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

  const existingUser = await prisma.user.findUnique({ where: { email } })
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
      email,
      password: hashedPassword,
      emailVerified: requireEmailVerification ? null : new Date(),
    },
  })

  if (requireEmailVerification) {
    const token = await generateVerificationToken(email)
    await sendVerificationEmail(email, token)
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
