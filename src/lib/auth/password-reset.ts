import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { resend } from "@/lib/resend"
import bcrypt from "bcryptjs"

const TOKEN_EXPIRY_HOURS = 1

export async function generatePasswordResetToken(email: string) {
  const token = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

  // Delete any existing reset tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  })

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  })

  return token
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000")
  const resetUrl = `${baseUrl}/reset-password?token=${token}`

  await resend.emails.send({
    from: "DevStash <onboarding@resend.dev>",
    to: email,
    subject: "Reset your DevStash password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #fff; margin-bottom: 16px;">Password Reset</h2>
        <p style="color: #ccc; line-height: 1.6;">
          You requested a password reset for your DevStash account. Click the button below to set a new password.
        </p>
        <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: #7c3aed; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Reset Password
        </a>
        <p style="color: #888; font-size: 14px; line-height: 1.5;">
          Or copy this link into your browser:<br/>
          <a href="${resetUrl}" style="color: #7c3aed;">${resetUrl}</a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 32px;">
          This link expires in ${TOKEN_EXPIRY_HOURS} hour. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  })
}

export async function resetPassword(token: string, newPassword: string) {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!record) {
    return { error: "Invalid or already used reset link." }
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { token },
    })
    return { error: "Reset link has expired. Please request a new one." }
  }

  const user = await prisma.user.findUnique({
    where: { email: record.identifier },
  })

  if (!user) {
    return { error: "User not found." }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { email: record.identifier },
    data: { password: hashedPassword },
  })

  await prisma.verificationToken.delete({
    where: { token },
  })

  return { success: true, email: record.identifier }
}
