'use client'

import { useTransition } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { generateDescription } from '@/actions/ai'

interface GenerateDescriptionButtonProps {
  title: string
  type: string
  content: string
  url: string
  tags: string[]
  language: string
  onGenerated: (description: string) => void
  isPro: boolean
}

export function GenerateDescriptionButton({
  title,
  type,
  content,
  url,
  tags,
  language,
  onGenerated,
  isPro,
}: GenerateDescriptionButtonProps) {
  const [pending, startTransition] = useTransition()

  if (!isPro) return null

  const handleGenerate = () => {
    if (!title.trim()) {
      toast.error('Add a title first so the AI has context')
      return
    }

    startTransition(async () => {
      const result = await generateDescription({ title, type, content, url, tags, language })
      if (result.success) {
        onGenerated(result.data.description)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleGenerate}
      disabled={pending}
      className="h-7 gap-1.5 text-xs text-muted-foreground"
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="h-3.5 w-3.5" />
      )}
      {pending ? 'Generating...' : 'Generate Description'}
    </Button>
  )
}
