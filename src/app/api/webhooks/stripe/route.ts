import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { syncSubscriptionStatus } from "@/lib/db/billing"
import type Stripe from "stripe"

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req: Request) {
  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    )
  }

  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    )
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET)
  } catch {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 },
    )
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id
      const isPro =
        subscription.status === "active" ||
        subscription.status === "trialing"
      await syncSubscriptionStatus(customerId, subscription.id, isPro)
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id
      await syncSubscriptionStatus(customerId, null, false)
      break
    }
  }

  return NextResponse.json({ received: true })
}
