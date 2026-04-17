'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, Zap, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface UpgradePromptProps {
  type: 'items' | 'collections' | 'files'
  current?: number
  limit?: number
}

export function UpgradePrompt({ type, current, limit }: UpgradePromptProps) {
  const [dismissed, setDismissed] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (dismissed) return null

  const isAtLimit = limit !== undefined && current !== undefined && current >= limit
  const isNearLimit = limit !== undefined && current !== undefined && current >= limit * 0.8 && !isAtLimit

  // Only show for files (always) or when near/at limit
  if (type !== 'files' && !isAtLimit && !isNearLimit) return null

  const messages: Record<string, { title: string; description: string }> = {
    items: isAtLimit
      ? { title: 'Item limit reached', description: `You've used all ${limit} items on the Free plan.` }
      : { title: 'Approaching item limit', description: `You've used ${current} of ${limit} items.` },
    collections: isAtLimit
      ? { title: 'Collection limit reached', description: `You've used all ${limit} collections on the Free plan.` }
      : { title: 'Approaching collection limit', description: `You've used ${current} of ${limit} collections.` },
    files: { title: 'File uploads are Pro only', description: 'Upgrade to Pro to upload files, templates, and configs.' },
  }

  const { title, description } = messages[type]

  function handleUpgrade() {
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY
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
    <div className={`relative rounded-lg border p-4 ${isAtLimit ? 'border-red-500/50 bg-red-500/5' : 'border-yellow-500/50 bg-yellow-500/5'}`}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`h-5 w-5 mt-0.5 shrink-0 ${isAtLimit ? 'text-red-400' : 'text-yellow-400'}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          <Button
            size="sm"
            onClick={handleUpgrade}
            disabled={isPending}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            {isPending ? 'Starting...' : 'Upgrade to Pro'}
          </Button>
        </div>
      </div>
    </div>
  )
}
