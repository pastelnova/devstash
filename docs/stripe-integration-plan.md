# Stripe Subscription Integration Plan

> DevStash Pro: $8/mo monthly, $72/year annual

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Implementation Plan](#2-implementation-plan)
3. [Files to Create](#3-files-to-create)
4. [Files to Modify](#4-files-to-modify)
5. [Stripe Dashboard Setup](#5-stripe-dashboard-setup)
6. [Testing Checklist](#6-testing-checklist)
7. [Implementation Order](#7-implementation-order)

---

## 1. Current State Analysis

### Database Schema (Ready)

The User model already has all needed fields (`prisma/schema.prisma:18-39`):

```prisma
model User {
  isPro                Boolean  @default(false)
  stripeCustomerId     String?
  stripeSubscriptionId String?
}
```

No migration needed for Stripe fields.

### Environment Variables (Ready)

Stripe env vars are already defined in `.env.example` and `.env`:

```
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_ID_MONTHLY="price_..."
STRIPE_PRICE_ID_YEARLY="price_..."
```

### Auth & Session (Needs Enhancement)

**Current state** (`src/auth.ts:21-33`): JWT callback only stores `token.id`. Session only exposes `user.id`.

**Gap**: `isPro` is NOT in the session/token. Components and server actions cannot check Pro status without a DB query.

**Type declaration** (`src/types/next-auth.d.ts`): Only extends `Session.user` with `id: string`.

### Feature Gating (Not Implemented)

**Free tier limits** (from `PricingSection.tsx:8-15`):
- 50 items max
- 3 collections max
- Image uploads allowed, file uploads Pro-only

**Current state**: No limit checks exist anywhere. All server actions (`src/actions/items.ts`, `src/actions/collections.ts`) and the upload route (`src/app/api/upload/route.ts`) accept requests from any authenticated user.

**Pro-only features** (from `PricingSection.tsx:17-26`):
- Unlimited items & collections
- File uploads (not image uploads)
- Custom item types (not yet built)
- AI features (not yet built)
- Export (not yet built)

### Sidebar Pro Badge (Exists)

`src/components/dashboard/Sidebar.tsx:123-127` already shows a "PRO" badge next to file and image item types. This is display-only.

### Existing Patterns

**Server actions** follow `{ success: true, data } | { success: false, error }` return type (`ActionResult<T>`).

**API routes** return `NextResponse.json()` with status codes (401, 400, etc.).

**Auth check pattern**: `const session = await auth(); if (!session?.user?.id) ...`

---

## 2. Implementation Plan

### Phase A: Session Enhancement

Add `isPro` to the JWT token and session so all components and server actions can check Pro status without extra DB queries.

**Key decision**: Per the research notes in `context/research/stripe-integration-research.md:47-66`, the JWT callback should always sync `isPro` from the database (not rely on `trigger === "update"`). This ensures the session stays in sync after Stripe webhook updates. A page reload after checkout is sufficient.

### Phase B: Stripe Library Setup

Create a Stripe client singleton and database helpers for customer/subscription management.

### Phase C: Checkout & Billing Portal

Create API routes for Stripe Checkout Session creation and Customer Portal access. Build the billing UI on the settings page.

### Phase D: Webhook Handler

Handle Stripe webhook events to sync subscription status with the database.

### Phase E: Feature Gating

Enforce free tier limits in server actions and the upload route. Add upgrade prompts in the UI.

### Phase F: UI Updates

Wire up pricing page CTAs, add billing section to settings, show plan badge in profile/sidebar.

---

## 3. Files to Create

### 3.1 `src/lib/stripe.ts` — Stripe Client

```typescript
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
})
```

### 3.2 `src/lib/db/billing.ts` — Billing Database Helpers

```typescript
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true, name: true },
  })

  if (user.stripeCustomerId) return user.stripeCustomerId

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
  stripeSubscriptionId: string,
  isPro: boolean,
): Promise<void> {
  await prisma.user.update({
    where: { stripeCustomerId },
    data: { isPro, stripeSubscriptionId: isPro ? stripeSubscriptionId : null },
  })
}

export async function getUserBillingInfo(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      isPro: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  })
}
```

### 3.3 `src/app/api/stripe/checkout/route.ts` — Create Checkout Session

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { stripe } from '@/lib/stripe'
import { getOrCreateStripeCustomer } from '@/lib/db/billing'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { priceId } = await request.json()

  const validPriceIds = [
    process.env.STRIPE_PRICE_ID_MONTHLY,
    process.env.STRIPE_PRICE_ID_YEARLY,
  ]
  if (!priceId || !validPriceIds.includes(priceId)) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
  }

  const customerId = await getOrCreateStripeCustomer(session.user.id)

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    subscription_data: {
      metadata: { userId: session.user.id },
    },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
```

### 3.4 `src/app/api/stripe/portal/route.ts` — Customer Portal

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { stripe } from '@/lib/stripe'
import { getUserBillingInfo } from '@/lib/db/billing'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const billing = await getUserBillingInfo(session.user.id)
  if (!billing?.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account' }, { status: 400 })
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: billing.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
  })

  return NextResponse.json({ url: portalSession.url })
}
```

### 3.5 `src/app/api/stripe/webhook/route.ts` — Webhook Handler

```typescript
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { syncSubscriptionStatus } from '@/lib/db/billing'
import type Stripe from 'stripe'

const relevantEvents = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
])

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (!relevantEvents.has(event.type)) {
    return NextResponse.json({ received: true })
  }

  const subscription = event.data.object as Stripe.Subscription
  const customerId = subscription.customer as string
  const isPro = ['active', 'trialing'].includes(subscription.status)

  await syncSubscriptionStatus(customerId, subscription.id, isPro)

  return NextResponse.json({ received: true })
}
```

**Important**: This route must NOT use the body-parsing middleware. Next.js App Router passes the raw body by default, so no extra config is needed.

### 3.6 `src/lib/plan-limits.ts` — Free Plan Limit Checks

```typescript
import { prisma } from '@/lib/prisma'

export const FREE_PLAN_ITEM_LIMIT = 50
export const FREE_PLAN_COLLECTION_LIMIT = 3

export async function canCreateItem(userId: string, isPro: boolean): Promise<boolean> {
  if (isPro) return true
  const count = await prisma.item.count({ where: { userId } })
  return count < FREE_PLAN_ITEM_LIMIT
}

export async function canCreateCollection(userId: string, isPro: boolean): Promise<boolean> {
  if (isPro) return true
  const count = await prisma.collection.count({ where: { userId } })
  return count < FREE_PLAN_COLLECTION_LIMIT
}

export async function getUserLimits(userId: string, isPro: boolean) {
  if (isPro) return { items: { current: 0, limit: null }, collections: { current: 0, limit: null } }

  const [itemCount, collectionCount] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
  ])

  return {
    items: { current: itemCount, limit: FREE_PLAN_ITEM_LIMIT },
    collections: { current: collectionCount, limit: FREE_PLAN_COLLECTION_LIMIT },
  }
}
```

### 3.7 `src/components/settings/BillingSection.tsx` — Billing UI

```typescript
'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

type Props = {
  isPro: boolean
  hasSubscription: boolean
}

export function BillingSection({ isPro, hasSubscription }: Props) {
  const [yearly, setYearly] = useState(false)
  const [pending, startTransition] = useTransition()

  async function handleCheckout() {
    startTransition(async () => {
      const priceId = yearly
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Failed to start checkout')
      }
    })
  }

  async function handlePortal() {
    startTransition(async () => {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Failed to open billing portal')
      }
    })
  }

  if (isPro) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold">Billing</h2>
          <Badge className="bg-blue-500 text-white">Pro</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          You're on the Pro plan. Manage your subscription, update payment methods, or cancel.
        </p>
        <Button onClick={handlePortal} disabled={pending} variant="outline">
          {pending ? 'Loading...' : 'Manage Subscription'}
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold mb-2">Upgrade to Pro</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Unlock unlimited items, file uploads, AI features, and more.
      </p>

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setYearly(false)}
          className={`text-sm font-medium px-3 py-1 rounded ${!yearly ? 'bg-blue-500 text-white' : 'text-muted-foreground'}`}
        >
          $8/mo
        </button>
        <button
          onClick={() => setYearly(true)}
          className={`text-sm font-medium px-3 py-1 rounded ${yearly ? 'bg-blue-500 text-white' : 'text-muted-foreground'}`}
        >
          $6/mo (billed yearly)
        </button>
      </div>

      <Button onClick={handleCheckout} disabled={pending}
        className="bg-gradient-to-r from-blue-600 via-blue-400 to-blue-300 text-white"
      >
        {pending ? 'Loading...' : 'Upgrade Now'}
      </Button>

      {hasSubscription && (
        <Button onClick={handlePortal} disabled={pending} variant="link" className="ml-2">
          Manage existing subscription
        </Button>
      )}
    </div>
  )
}
```

### 3.8 `src/components/dashboard/UpgradePrompt.tsx` — Limit Reached UI

```typescript
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

type Props = {
  resource: 'item' | 'collection'
  current: number
  limit: number
}

export function UpgradePrompt({ resource, current, limit }: Props) {
  return (
    <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 text-center">
      <p className="text-sm text-muted-foreground mb-2">
        You've reached {current}/{limit} {resource}s on the free plan.
      </p>
      <Link href="/settings" className={buttonVariants({ size: 'sm', className: 'bg-blue-500 text-white' })}>
        Upgrade to Pro
      </Link>
    </div>
  )
}
```

---

## 4. Files to Modify

### 4.1 `src/auth.ts` — Add `isPro` to Session

**JWT callback** (lines 21-25): Always sync `isPro` from DB.

```typescript
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id
    }

    // Always sync isPro from database to catch webhook updates
    if (token.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { isPro: true },
      })
      token.isPro = dbUser?.isPro ?? false
    }

    return token
  },
  session({ session, token }) {
    if (session.user && token.id) {
      session.user.id = token.id as string
      session.user.isPro = token.isPro as boolean
    }
    return session
  },
},
```

### 4.2 `src/types/next-auth.d.ts` — Extend Types

```typescript
import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      isPro: boolean
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isPro?: boolean
  }
}
```

### 4.3 `src/actions/items.ts` — Add Free Plan Limit Check

Add to `createItem` (after auth check, before Zod parse):

```typescript
// Check free plan item limit
const userRecord = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { isPro: true },
})
if (!userRecord?.isPro) {
  const itemCount = await prisma.item.count({ where: { userId: session.user.id } })
  if (itemCount >= 50) {
    return { success: false, error: 'Free plan limit reached (50 items). Upgrade to Pro for unlimited items.' }
  }
}
```

Add the same check to `createFileItem`.

Add Pro-only check for file uploads in `createFileItem`:

```typescript
if (parsed.data.type === 'file') {
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPro: true },
  })
  if (!user?.isPro) {
    return { success: false, error: 'File uploads are a Pro feature. Upgrade to unlock.' }
  }
}
```

### 4.4 `src/actions/collections.ts` — Add Free Plan Limit Check

Add to `createCollection` (after auth check):

```typescript
const userRecord = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { isPro: true },
})
if (!userRecord?.isPro) {
  const collectionCount = await prisma.collection.count({ where: { userId: session.user.id } })
  if (collectionCount >= 3) {
    return { success: false, error: 'Free plan limit reached (3 collections). Upgrade to Pro for unlimited.' }
  }
}
```

### 4.5 `src/app/api/upload/route.ts` — Pro Check for File Uploads

Add after auth check (line 42):

```typescript
// File uploads are Pro-only (images allowed for free)
if (itemType === 'file') {
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPro: true },
  })
  if (!user?.isPro) {
    return NextResponse.json(
      { error: 'File uploads are a Pro feature' },
      { status: 403 },
    )
  }
}
```

### 4.6 `src/app/settings/page.tsx` — Add Billing Section

```typescript
import { BillingSection } from '@/components/settings/BillingSection'
import { getUserBillingInfo } from '@/lib/db/billing'

// In Promise.all, add:
getUserBillingInfo(userId),

// In JSX, add before EditorPreferencesSection:
<BillingSection
  isPro={billing?.isPro ?? false}
  hasSubscription={!!billing?.stripeSubscriptionId}
/>
```

### 4.7 `src/components/homepage/PricingSection.tsx` — Wire CTA Buttons

The "Upgrade to Pro" button currently links to `/register`. For logged-in users, it should trigger checkout. For logged-out users, it should link to `/register`.

Option: Keep linking to `/register` for now. After login, users upgrade from the settings page. This is simplest and avoids passing session state to a client component on the homepage.

### 4.8 `src/lib/constants.ts` — Add Plan Limit Constants

```typescript
export const FREE_PLAN_ITEM_LIMIT = 50
export const FREE_PLAN_COLLECTION_LIMIT = 3
```

### 4.9 `src/components/dashboard/Sidebar.tsx` — Pro Badge Enhancement

The sidebar already shows PRO badges on file/image types. Consider adding a small plan indicator near the user's name at the bottom of the sidebar (e.g., "Free" or "Pro" badge).

### 4.10 `.env.example` — Add App URL

```
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=""
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=""
```

---

## 5. Stripe Dashboard Setup

### 5.1 Create Products & Prices

1. Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products)
2. Create a product called **"DevStash Pro"**
3. Add two prices:
   - **Monthly**: $8.00 USD, recurring monthly
   - **Yearly**: $72.00 USD, recurring yearly ($6/mo effective)
4. Copy price IDs into `STRIPE_PRICE_ID_MONTHLY` and `STRIPE_PRICE_ID_YEARLY` env vars

### 5.2 Configure Webhook

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`

### 5.3 Configure Customer Portal

1. Go to [Stripe Dashboard > Settings > Customer Portal](https://dashboard.stripe.com/settings/billing/portal)
2. Enable:
   - Cancel subscription
   - Switch plans (monthly <-> yearly)
   - Update payment method
   - View invoices

### 5.4 Local Development with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook signing secret from the CLI output into .env
```

---

## 6. Testing Checklist

### Unit Tests (Vitest)

- [ ] `src/lib/plan-limits.test.ts` — `canCreateItem` returns true for Pro, false at limit for free
- [ ] `src/lib/plan-limits.test.ts` — `canCreateCollection` returns true for Pro, false at limit for free
- [ ] `src/actions/items.test.ts` — `createItem` returns error when free plan limit reached
- [ ] `src/actions/items.test.ts` — `createFileItem` returns error for non-Pro file uploads
- [ ] `src/actions/collections.test.ts` — `createCollection` returns error when free plan limit reached
- [ ] `src/lib/db/billing.test.ts` — `getOrCreateStripeCustomer` creates customer when none exists
- [ ] `src/lib/db/billing.test.ts` — `getOrCreateStripeCustomer` returns existing customer ID
- [ ] `src/lib/db/billing.test.ts` — `syncSubscriptionStatus` updates isPro and subscription ID

### Manual Testing

- [ ] Free user can create up to 50 items, blocked at 51st
- [ ] Free user can create up to 3 collections, blocked at 4th
- [ ] Free user can upload images but NOT files
- [ ] Free user sees upgrade prompts when limits reached
- [ ] Checkout flow: click upgrade -> Stripe Checkout -> payment -> redirect back
- [ ] After checkout, `isPro` is true in session after page reload
- [ ] Pro user has no limits on items or collections
- [ ] Pro user can upload files
- [ ] Billing portal: manage subscription, cancel, update payment
- [ ] After cancellation via portal, `isPro` becomes false (webhook processed)
- [ ] Switching plans (monthly <-> yearly) works via portal

### Webhook Testing (Stripe CLI)

```bash
# Test checkout completed
stripe trigger checkout.session.completed

# Test subscription events
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

---

## 7. Implementation Order

### Step 1: Install Stripe SDK

```bash
npm install stripe
```

### Step 2: Session Enhancement

1. Modify `src/types/next-auth.d.ts` — add `isPro` to Session and JWT types
2. Modify `src/auth.ts` — add `isPro` DB sync in JWT callback, expose in session callback
3. Verify: log `session.user.isPro` on dashboard page, confirm it's `false` for demo user

### Step 3: Stripe Client & DB Helpers

1. Create `src/lib/stripe.ts`
2. Create `src/lib/db/billing.ts`
3. Write unit tests for billing helpers

### Step 4: Checkout & Portal API Routes

1. Create `src/app/api/stripe/checkout/route.ts`
2. Create `src/app/api/stripe/portal/route.ts`
3. Add `NEXT_PUBLIC_APP_URL` to `.env`

### Step 5: Webhook Handler

1. Create `src/app/api/stripe/webhook/route.ts`
2. Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
3. Trigger test events and verify DB updates

### Step 6: Billing UI

1. Create `src/components/settings/BillingSection.tsx`
2. Modify `src/app/settings/page.tsx` to include billing section
3. Test full checkout flow end-to-end

### Step 7: Free Plan Limits

1. Create `src/lib/plan-limits.ts` with limit constants and check functions
2. Add `FREE_PLAN_ITEM_LIMIT` and `FREE_PLAN_COLLECTION_LIMIT` to `src/lib/constants.ts`
3. Modify `src/actions/items.ts` — add limit check in `createItem` and `createFileItem`
4. Modify `src/actions/collections.ts` — add limit check in `createCollection`
5. Modify `src/app/api/upload/route.ts` — add Pro check for file uploads
6. Write unit tests for limit enforcement
7. Create `src/components/dashboard/UpgradePrompt.tsx`

### Step 8: UI Polish

1. Add plan badge to sidebar user section
2. Show upgrade prompt when limits are approached
3. Ensure error messages from server actions display correctly in forms/toasts
4. Add `?upgraded=true` handling on settings page (success toast after checkout)

---

## Architecture Notes

### Why Always-Sync `isPro` in JWT Callback

The research note (`context/research/stripe-integration-research.md:45-68`) documents that NextAuth v5's `trigger === "update"` is unreliable for syncing webhook-driven DB changes. Instead, the JWT callback always queries the database for `isPro`:

```typescript
async jwt({ token, user }) {
  if (user) token.id = user.id
  if (token.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: { isPro: true },
    })
    token.isPro = dbUser?.isPro ?? false
  }
  return token
}
```

**Trade-off**: One small `SELECT isPro FROM User WHERE id = ?` per session validation. This is acceptable because:
- The query is indexed (primary key lookup)
- It guarantees correctness after webhook updates
- A simple page reload after checkout picks up the new Pro status

### Webhook Idempotency

The webhook handler uses `syncSubscriptionStatus` which is an upsert-style operation. Processing the same event twice is safe — it sets the same values.

### Stripe Customer Portal vs Custom UI

Using Stripe's hosted Customer Portal for subscription management (cancel, switch plans, update payment) instead of building a custom UI. Benefits:
- PCI compliance handled by Stripe
- Automatic localization
- Less code to maintain
- Stripe handles all edge cases (proration, etc.)
