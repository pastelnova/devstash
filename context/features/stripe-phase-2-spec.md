# Stripe Integration - Phase 2: Webhooks, Feature Gating & UI

## Overview

Build the webhook handler, enforce free-tier limits in server actions and the upload route, create the billing UI and upgrade prompts, and wire up the settings page. This phase requires Stripe CLI for webhook testing and a running dev server for end-to-end verification.

## Prerequisites

- Phase 1 complete (session has `isPro`, Stripe client exists, checkout/portal routes exist, plan-limits module exists)
- Stripe CLI installed and authenticated (`brew install stripe/stripe-cli/stripe && stripe login`)
- Stripe Dashboard configured: product created, monthly/yearly prices, webhook endpoint, Customer Portal enabled

## Requirements

### Step 1: Webhook Handler

- **Create `src/app/api/stripe/webhook/route.ts`** - POST, reads raw body, verifies signature with `STRIPE_WEBHOOK_SECRET`
- Handle events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- Extract `subscription.customer` (string) and `subscription.status`; `isPro = status in ['active', 'trialing']`
- Call `syncSubscriptionStatus(customerId, subscriptionId, isPro)` from `src/lib/db/billing.ts`
- Return `{ received: true }` for all events (including unhandled ones)
- No body-parsing middleware needed (Next.js App Router passes raw body by default)

### Step 2: Feature Gating in Server Actions

- **Modify `src/actions/items.ts`**:
  - `createItem`: after auth check, query `isPro`; if free and item count >= 50, return error
  - `createFileItem`: same item limit check; additionally, if `type === 'file'` and not Pro, return error (images allowed for free)
- **Modify `src/actions/collections.ts`**:
  - `createCollection`: after auth check, query `isPro`; if free and collection count >= 3, return error
- **Modify `src/app/api/upload/route.ts`**:
  - After auth check, if `itemType === 'file'` and user is not Pro, return 403

Use constants from `src/lib/plan-limits.ts` (`FREE_PLAN_ITEM_LIMIT`, `FREE_PLAN_COLLECTION_LIMIT`).

### Step 3: Billing UI

- **Create `src/components/settings/BillingSection.tsx`** - Client component:
  - Pro users: shows "Pro" badge, "Manage Subscription" button (opens Stripe Customer Portal)
  - Free users: monthly/yearly toggle ($8/mo vs $6/mo billed yearly), "Upgrade Now" button (creates checkout session)
  - Uses `useTransition` for pending states, sonner toasts for errors
- **Modify `src/app/settings/page.tsx`**:
  - Fetch `getUserBillingInfo(userId)` in `Promise.all`
  - Render `BillingSection` before `EditorPreferencesSection`
  - Handle `?upgraded=true` query param with success toast

### Step 4: Upgrade Prompt Component

- **Create `src/components/dashboard/UpgradePrompt.tsx`** - Shows "{current}/{limit} {resource}s on free plan" with "Upgrade to Pro" link to `/settings`
- Display in item create dialog and collection create dialog when user is near or at limit

### Step 5: UI Polish

- Add plan badge (Free/Pro) to sidebar user section in `Sidebar.tsx`
- Ensure server action error messages for limit/Pro-only restrictions display correctly in existing form toasts
- Homepage pricing CTA: keep linking to `/register` for now (users upgrade from settings after login)

## Files to Create

1. `src/app/api/stripe/webhook/route.ts`
2. `src/components/settings/BillingSection.tsx`
3. `src/components/dashboard/UpgradePrompt.tsx`

## Files to Modify

1. `src/actions/items.ts` - Add free plan limit check in `createItem` and `createFileItem`; Pro-only check for file type in `createFileItem`
2. `src/actions/collections.ts` - Add free plan limit check in `createCollection`
3. `src/app/api/upload/route.ts` - Add Pro check for file uploads (images stay free)
4. `src/app/settings/page.tsx` - Add `BillingSection`, handle `?upgraded=true` toast
5. `src/components/dashboard/Sidebar.tsx` - Add Free/Pro badge near user name
6. `.env` / `.env.example` - Add `STRIPE_WEBHOOK_SECRET`

## Unit Tests

### `src/actions/items.test.ts` (add cases)

- `createItem` returns error when free user at 50 item limit
- `createItem` succeeds for Pro user regardless of count
- `createFileItem` returns error for non-Pro file upload (type `file`)
- `createFileItem` succeeds for non-Pro image upload (type `image`)
- `createFileItem` returns error when free user at 50 item limit

### `src/actions/collections.test.ts` (add cases)

- `createCollection` returns error when free user at 3 collection limit
- `createCollection` succeeds for Pro user regardless of count

## Manual Testing (requires Stripe CLI)

```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test subscription lifecycle
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

### Checkout Flow
- Free user clicks "Upgrade Now" on settings page
- Redirected to Stripe Checkout with correct price
- After payment, redirected to `/settings?upgraded=true` with success toast
- Page reload shows `isPro: true` in session

### Billing Portal
- Pro user clicks "Manage Subscription" on settings page
- Can cancel, switch plans (monthly <-> yearly), update payment method
- After cancellation, webhook sets `isPro: false`

### Feature Gating
- Free user blocked at 51st item with upgrade prompt
- Free user blocked at 4th collection with upgrade prompt
- Free user can upload images but not files
- Pro user has no limits

## Key Decisions

- **Stripe Customer Portal** for subscription management instead of custom UI — handles PCI compliance, localization, proration, and edge cases
- **Webhook idempotency**: `syncSubscriptionStatus` is upsert-style; processing same event twice is safe
- **Homepage pricing CTA** stays as `/register` link — avoids passing session state to homepage client components
