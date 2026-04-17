'use client'

import { useTransition } from 'react'
import { Lock, Zap, FileText, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ProTypeGateProps {
  typeName: 'file' | 'image'
}

const typeConfig = {
  file: {
    icon: FileText,
    title: 'File uploads are a Pro feature',
    description: 'Upload files, templates, configs, and documents with DevStash Pro.',
    color: '#6b7280',
  },
  image: {
    icon: Image,
    title: 'Image uploads are a Pro feature',
    description: 'Upload screenshots, diagrams, and reference images with DevStash Pro.',
    color: '#ec4899',
  },
}

export function ProTypeGate({ typeName }: ProTypeGateProps) {
  const [isPending, startTransition] = useTransition()
  const config = typeConfig[typeName]
  const TypeIcon = config.icon

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
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div
        className="h-16 w-16 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: `${config.color}22` }}
      >
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <TypeIcon className="h-5 w-5" style={{ color: config.color }} />
        <h2 className="text-xl font-semibold">{config.title}</h2>
      </div>

      <p className="text-muted-foreground max-w-md mb-8">
        {config.description}
      </p>

      <Button
        onClick={handleUpgrade}
        disabled={isPending}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Zap className="h-4 w-4 mr-2" />
        {isPending ? 'Starting...' : 'Upgrade to Pro'}
      </Button>
    </div>
  )
}
