import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../../generated/prisma/client"

// Prisma 7: driver adapter is required — PrismaClient no longer has built-in drivers.
// PrismaPg wraps the pg connection and must be passed to PrismaClient.
// Next.js loads env vars automatically; dotenv is not needed here.

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')

const adapter = new PrismaPg({ connectionString })

// Prevent multiple PrismaClient instances in development (hot reload creates new modules).
// In production, always create a single instance.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
