'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'

export function useStripeCheckout() {
  const [isPending, startTransition] = useTransition()

  const startCheckout = (priceId: string) => {
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

  return { startCheckout, isPending }
}
