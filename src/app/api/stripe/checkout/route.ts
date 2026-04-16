import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { stripe } from "@/lib/stripe"
import { getOrCreateStripeCustomer } from "@/lib/db/billing"

const VALID_PRICE_IDS = new Set([
  process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY,
  process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY,
].filter(Boolean))

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { priceId } = await req.json()
  if (!priceId || !VALID_PRICE_IDS.has(priceId)) {
    return NextResponse.json({ error: "Invalid price ID" }, { status: 400 })
  }

  const customerId = await getOrCreateStripeCustomer(session.user.id)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=true`,
    cancel_url: `${appUrl}/dashboard`,
    metadata: { userId: session.user.id },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
