'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Check, Zap } from 'lucide-react'
import { toast } from 'sonner'

const FREE_FEATURES = [
  'Up to 50 items',
  '3 collections',
  'Full-text search',
  'Image uploads',
  'Dark mode',
  'GitHub OAuth',
]

const PRO_FEATURES = [
  'Unlimited items',
  'Unlimited collections',
  'File uploads',
  'Custom item types',
  'AI auto-tagging',
  'AI summaries & explanations',
  'Export (JSON / ZIP)',
  'Priority support',
]

export function UpgradeContent() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [isPending, startTransition] = useTransition()

  function handleUpgrade() {
    const priceId = billingPeriod === 'monthly'
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY
      : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY

    if (!priceId) {
      toast.error('Billing is not configured')
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId }),
        })
        const data = await res.json()
        if (data.url) {
          window.location.href = data.url
        } else {
          toast.error(data.error ?? 'Failed to start checkout')
        }
      } catch {
        toast.error('Failed to start checkout')
      }
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[900px] px-6 py-12">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Upgrade to{' '}
            <span className="bg-gradient-to-r from-blue-600 via-blue-400 to-blue-300 bg-clip-text text-transparent">
              Pro
            </span>
          </h1>
          <p className="mt-3 text-muted-foreground text-lg">
            Unlock AI superpowers, unlimited storage, and more.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mb-10 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative h-[26px] w-12 rounded-full transition-colors ${
              billingPeriod === 'yearly' ? 'bg-blue-500' : 'bg-white/10'
            }`}
            aria-label="Toggle billing period"
          >
            <span
              className={`absolute top-[3px] left-[3px] h-5 w-5 rounded-full bg-white transition-transform ${
                billingPeriod === 'yearly' ? 'translate-x-[22px]' : ''
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Yearly{' '}
            <span className="ml-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-bold text-green-500">
              Save 25%
            </span>
          </span>
        </div>

        {/* Plan cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Free — current plan */}
          <div className="rounded-xl border border-border bg-card p-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold">Free</h2>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Current plan
              </span>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-extrabold tracking-tight">&euro;0</span>
              <span className="ml-1 text-muted-foreground">forever</span>
            </div>
            <ul className="flex flex-col gap-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="relative rounded-xl border border-blue-500 bg-gradient-to-b from-blue-500/5 to-card p-8">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-500 px-4 py-1 text-xs font-bold text-white">
              Recommended
            </span>
            <h2 className="text-xl font-bold mb-4">Pro</h2>
            <div className="mb-6">
              <span className="text-4xl font-extrabold tracking-tight">
                {billingPeriod === 'yearly' ? '€6' : '€8'}
              </span>
              <span className="ml-1 text-muted-foreground">
                {billingPeriod === 'yearly' ? '/mo (billed €72/yr)' : '/month'}
              </span>
            </div>
            <ul className="flex flex-col gap-3 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 shrink-0 text-blue-500" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={handleUpgrade}
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isPending ? 'Starting checkout...' : `Upgrade to Pro — €${billingPeriod === 'yearly' ? '72/yr' : '8/mo'}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
