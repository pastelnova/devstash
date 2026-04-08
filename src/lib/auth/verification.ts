import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { resend } from "@/lib/resend"

const TOKEN_EXPIRY_HOURS = 24

export async function generateVerificationToken(email: string) {
  const token = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

  const identifier = `verify:${email}`

  // Delete any existing verification tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier },
  })

  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
    },
  })

  return token
}

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000")
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`

  await resend.emails.send({
    from: "DevStash <onboarding@resend.dev>",
    to: email,
    subject: "Verify your DevStash account",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #fff; margin-bottom: 16px;">Welcome to DevStash!</h2>
        <p style="color: #ccc; line-height: 1.6;">
          Click the button below to verify your email address and activate your account.
        </p>
        <a href="${verifyUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: #7c3aed; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Verify Email
        </a>
        <p style="color: #888; font-size: 14px; line-height: 1.5;">
          Or copy this link into your browser:<br/>
          <a href="${verifyUrl}" style="color: #7c3aed;">${verifyUrl}</a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 32px;">
          This link expires in ${TOKEN_EXPIRY_HOURS} hours. If you didn't create an account, ignore this email.
        </p>
      </div>
    `,
  })
}

export async function verifyToken(token: string) {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!record) {
    return { error: "Invalid verification link." }
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { token },
    })
    return { error: "Verification link has expired. Please register again." }
  }

  // Extract email from namespaced identifier
  const email = record.identifier.replace("verify:", "")

  // Mark user as verified
  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  })

  // Clean up used token
  await prisma.verificationToken.delete({
    where: { token },
  })

  return { success: true, email }
}
