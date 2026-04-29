'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { getOpenAIClient, AI_MODEL } from '@/lib/openai'
import { rateLimiters } from '@/lib/rate-limit'

const generateAutoTagsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional().default(''),
  existingTags: z.array(z.string()).optional().default([]),
})

export type GenerateAutoTagsInput = z.input<typeof generateAutoTagsSchema>

type GenerateAutoTagsResult =
  | { success: true; data: { tags: string[] } }
  | { success: false; error: string }

export async function generateAutoTags(
  input: GenerateAutoTagsInput
): Promise<GenerateAutoTagsResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    if (!session.user.isPro) {
      return { success: false, error: 'AI features require a Pro plan' }
    }

    const parsed = generateAutoTagsSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    // Rate limit by user ID
    const limiter = rateLimiters.ai
    if (limiter) {
      try {
        const { success } = await limiter.limit(session.user.id)
        if (!success) {
          return { success: false, error: 'Rate limit exceeded. Please try again later.' }
        }
      } catch {
        // Fail open if Upstash is down
      }
    }

    const { title, content, existingTags } = parsed.data

    // Truncate content to 2000 chars
    const truncatedContent = content.slice(0, 2000)

    const itemText = truncatedContent
      ? `Title: ${title}\n\nContent:\n${truncatedContent}`
      : `Title: ${title}`

    const existingTagsHint = existingTags.length > 0
      ? `\nThe item already has these tags: ${existingTags.join(', ')}. Suggest different tags.`
      : ''

    const response = await getOpenAIClient().responses.create({
      model: AI_MODEL,
      instructions: 'You are a developer tool assistant that suggests relevant tags for code snippets, prompts, commands, notes, and links. Return a JSON object with a "tags" key containing an array of 3-5 short, relevant tags. Tags should be lowercase, single words or short hyphenated phrases.',
      input: `Suggest 3-5 tags for this item. Respond in json format.\n\n${itemText}${existingTagsHint}`,
      text: {
        format: { type: 'json_object' },
      },
    })

    const text = response.output_text
    const parsed_json = JSON.parse(text)

    // Handle both {"tags": [...]} and [...] formats
    const rawTags: unknown[] = Array.isArray(parsed_json)
      ? parsed_json
      : parsed_json.tags

    if (!Array.isArray(rawTags)) {
      return { success: false, error: 'AI returned an unexpected format' }
    }

    const tags = rawTags
      .filter((t): t is string => typeof t === 'string')
      .map((t) => t.toLowerCase().trim())
      .filter((t) => t.length > 0)

    return { success: true, data: { tags } }
  } catch (error) {
    console.error('[generateAutoTags] Error:', error)
    if (error instanceof SyntaxError) {
      return { success: false, error: 'AI returned invalid JSON' }
    }
    return { success: false, error: 'Failed to generate tags. Please try again.' }
  }
}
