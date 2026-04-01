import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../../generated/prisma/client"

// Prisma 7: driver adapter is required — PrismaClient no longer has built-in drivers.
// PrismaPg wraps the pg connection and must be passed to PrismaClient.
// Next.js loads env vars automatically; dotenv is not needed here.

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })

// Prevent multiple PrismaClient instances in development (hot reload creates new modules).
// In production, always create a single instance.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
