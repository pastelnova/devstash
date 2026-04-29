'use client'

import { useState, useTransition } from 'react'
import { Sparkles, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { generateAutoTags } from '@/actions/ai'

interface SuggestTagsButtonProps {
  title: string
  content: string
  existingTags: string[]
  onAcceptTag: (tag: string) => void
  isPro: boolean
}

export function SuggestTagsButton({
  title,
  content,
  existingTags,
  onAcceptTag,
  isPro,
}: SuggestTagsButtonProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [pending, startTransition] = useTransition()

  if (!isPro) return null

  const handleSuggest = () => {
    startTransition(async () => {
      const result = await generateAutoTags({ title, content, existingTags })
      if (result.success) {
        // Filter out tags that already exist
        const existingLower = new Set(existingTags.map((t) => t.toLowerCase()))
        const newTags = result.data.tags.filter((t) => !existingLower.has(t))
        if (newTags.length === 0) {
          toast.info('No new tag suggestions — your tags already cover this item')
        } else {
          setSuggestions(newTags)
        }
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleAccept = (tag: string) => {
    onAcceptTag(tag)
    setSuggestions((prev) => prev.filter((t) => t !== tag))
  }

  const handleReject = (tag: string) => {
    setSuggestions((prev) => prev.filter((t) => t !== tag))
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleSuggest}
        disabled={pending}
        className="h-7 gap-1.5 text-xs text-muted-foreground"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        {pending ? 'Suggesting…' : 'Suggest Tags'}
      </Button>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                onClick={() => handleAccept(tag)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-green-500/20 transition-colors"
                aria-label={`Accept tag "${tag}"`}
              >
                <Check className="h-3 w-3 text-green-500" />
              </button>
              <button
                type="button"
                onClick={() => handleReject(tag)}
                className="rounded-full p-0.5 hover:bg-destructive/20 transition-colors"
                aria-label={`Reject tag "${tag}"`}
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
