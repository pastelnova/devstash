# Stripe Integration - Phase 1: Core Infrastructure

## Overview

Install Stripe SDK, enhance the session with `isPro`, create the Stripe client singleton, billing DB helpers, checkout/portal API routes, and the plan-limits module. This phase covers everything that can be built and unit-tested without Stripe CLI or live webhooks.

## Requirements

### Step 1: Install Stripe SDK

```bash
npm install stripe
```

### Step 2: Session Enhancement

Add `isPro` to the JWT token and session so all components and server actions can check Pro status without extra DB queries.

- **`src/types/next-auth.d.ts`** - Add `isPro: boolean` to `Session.user` and `isPro?: boolean` to `JWT`
- **`src/auth.ts`** - JWT callback: always query DB for `isPro` (not just on `trigger === "update"`). Session callback: expose `token.isPro` as `session.user.isPro`
- Verify: `session.user.isPro` should be `false` for existing users

### Step 3: Stripe Client & Billing DB Helpers

- **Create `src/lib/stripe.ts`** - Stripe client singleton, throws if `STRIPE_SECRET_KEY` missing
- **Create `src/lib/db/billing.ts`** with:
  - `getOrCreateStripeCustomer(userId)` - finds or creates Stripe customer, stores `stripeCustomerId` on User
  - `syncSubscriptionStatus(stripeCustomerId, stripeSubscriptionId, isPro)` - updates User record
  - `getUserBillingInfo(userId)` - returns `isPro`, `stripeCustomerId`, `stripeSubscriptionId`

### Step 4: Checkout & Portal API Routes

- **Create `src/app/api/stripe/checkout/route.ts`** - POST, auth check, validates `priceId` against env vars, creates Stripe Checkout Session with `success_url` and `cancel_url`
- **Create `src/app/api/stripe/portal/route.ts`** - POST, auth check, creates Stripe Customer Portal session
- Add `NEXT_PUBLIC_APP_URL` to `.env` and `.env.example`

### Step 5: Plan Limits Module

- **Create `src/lib/plan-limits.ts`** with:
  - `FREE_PLAN_ITEM_LIMIT = 50`
  - `FREE_PLAN_COLLECTION_LIMIT = 3`
  - `canCreateItem(userId, isPro)` - returns true for Pro, checks count for free
  - `canCreateCollection(userId, isPro)` - same pattern
  - `getUserLimits(userId, isPro)` - returns `{ items: { current, limit }, collections: { current, limit } }`

## Files to Create

1. `src/lib/stripe.ts`
2. `src/lib/db/billing.ts`
3. `src/app/api/stripe/checkout/route.ts`
4. `src/app/api/stripe/portal/route.ts`
5. `src/lib/plan-limits.ts`

## Files to Modify

1. `src/types/next-auth.d.ts` - Add `isPro` to Session and JWT types
2. `src/auth.ts` - Sync `isPro` from DB in JWT callback, expose in session callback
3. `.env` / `.env.example` - Add `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY`, `NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY`

## Unit Tests

### `src/lib/plan-limits.test.ts`

- `canCreateItem` returns `true` for Pro user regardless of count
- `canCreateItem` returns `true` for free user below limit (< 50)
- `canCreateItem` returns `false` for free user at limit (>= 50)
- `canCreateCollection` returns `true` for Pro user regardless of count
- `canCreateCollection` returns `true` for free user below limit (< 3)
- `canCreateCollection` returns `false` for free user at limit (>= 3)
- `getUserLimits` returns `null` limits for Pro user
- `getUserLimits` returns correct current counts and limits for free user

### `src/lib/db/billing.test.ts`

- `getOrCreateStripeCustomer` returns existing `stripeCustomerId` when present
- `getOrCreateStripeCustomer` creates Stripe customer and stores ID when none exists
- `syncSubscriptionStatus` updates `isPro` and `stripeSubscriptionId`
- `syncSubscriptionStatus` nulls `stripeSubscriptionId` when `isPro` is false
- `getUserBillingInfo` returns billing fields for user

## Key Decisions

- **Always-sync `isPro` in JWT callback**: One indexed `SELECT isPro FROM User WHERE id = ?` per session validation. Guarantees correctness after webhook updates without relying on `trigger === "update"`. A page reload after checkout picks up new Pro status.
- **Plan limits module is pure logic + Prisma counts**: No Stripe dependency, fully testable with mocked Prisma.

## Environment Variables

```
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=""
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=""
```
