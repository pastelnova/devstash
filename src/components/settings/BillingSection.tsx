'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, ExternalLink, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface BillingSectionProps {
  isPro: boolean
  itemCount: number
  itemLimit: number | null
  collectionCount: number
  collectionLimit: number | null
}

export function BillingSection({
  isPro,
  itemCount,
  itemLimit,
  collectionCount,
  collectionLimit,
}: BillingSectionProps) {
  const [isPending, startTransition] = useTransition()
  const [billingType, setBillingType] = useState<'monthly' | 'yearly'>('monthly')

  function handleUpgrade() {
    const priceId = billingType === 'monthly'
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

  function handleManage() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/stripe/portal', { method: 'POST' })
        const data = await res.json()
        if (data.url) {
          window.location.href = data.url
        } else {
          toast.error(data.error ?? 'Failed to open billing portal')
        }
      } catch {
        toast.error('Failed to open billing portal')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Billing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current plan */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Current plan:</span>
          {isPro ? (
            <Badge className="bg-blue-600 hover:bg-blue-700 text-white">Pro</Badge>
          ) : (
            <Badge variant="secondary">Free</Badge>
          )}
        </div>

        {/* Usage */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Items</span>
            <span>
              {itemCount}{itemLimit !== null ? ` / ${itemLimit}` : ''}{' '}
              {isPro && <span className="text-muted-foreground">(unlimited)</span>}
            </span>
          </div>
          {itemLimit !== null && (
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all bg-blue-500"
                style={{ width: `${Math.min((itemCount / itemLimit) * 100, 100)}%` }}
              />
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Collections</span>
            <span>
              {collectionCount}{collectionLimit !== null ? ` / ${collectionLimit}` : ''}{' '}
              {isPro && <span className="text-muted-foreground">(unlimited)</span>}
            </span>
          </div>
          {collectionLimit !== null && (
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all bg-blue-500"
                style={{ width: `${Math.min((collectionCount / collectionLimit) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        {isPro ? (
          <Button
            variant="outline"
            onClick={handleManage}
            disabled={isPending}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {isPending ? 'Opening...' : 'Manage Subscription'}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setBillingType('monthly')}
                className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                  billingType === 'monthly'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-border text-muted-foreground hover:border-muted-foreground'
                }`}
              >
                <div className="font-medium">$8/mo</div>
                <div className="text-xs">Monthly</div>
              </button>
              <button
                onClick={() => setBillingType('yearly')}
                className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                  billingType === 'yearly'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-border text-muted-foreground hover:border-muted-foreground'
                }`}
              >
                <div className="font-medium">$72/yr</div>
                <div className="text-xs">Yearly (save 25%)</div>
              </button>
            </div>
            <Button
              onClick={handleUpgrade}
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isPending ? 'Starting checkout...' : 'Upgrade to Pro'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
