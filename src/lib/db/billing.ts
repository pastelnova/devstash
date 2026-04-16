import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

export async function getOrCreateStripeCustomer(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true, name: true },
  })

  if (user.stripeCustomerId) {
    return user.stripeCustomerId
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId },
  })

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  })

  return customer.id
}

export async function syncSubscriptionStatus(
  stripeCustomerId: string,
  stripeSubscriptionId: string | null,
  isPro: boolean
) {
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId },
    select: { id: true },
  })

  if (!user) return

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isPro,
      stripeSubscriptionId: isPro ? stripeSubscriptionId : null,
    },
  })
}

export async function getUserBillingInfo(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      isPro: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  })

  return user
}
