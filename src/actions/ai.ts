'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { getOpenAIClient, AI_MODEL } from '@/lib/openai'
import { rateLimiters } from '@/lib/rate-limit'

const generateDescriptionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.string().min(1, 'Type is required'),
  content: z.string().optional().default(''),
  url: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  language: z.string().optional().default(''),
})

export type GenerateDescriptionInput = z.input<typeof generateDescriptionSchema>

type GenerateDescriptionResult =
  | { success: true; data: { description: string } }
  | { success: false; error: string }

export async function generateDescription(
  input: GenerateDescriptionInput
): Promise<GenerateDescriptionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    if (!session.user.isPro) {
      return { success: false, error: 'AI features require a Pro plan' }
    }

    const parsed = generateDescriptionSchema.safeParse(input)
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

    const { title, type, content, url, tags, language } = parsed.data

    // Truncate content to 2000 chars
    const truncatedContent = content.slice(0, 2000)

    // Build context from all available fields
    let itemContext = `Title: ${title}\nType: ${type}`
    if (language) itemContext += `\nLanguage: ${language}`
    if (truncatedContent) itemContext += `\n\nContent:\n${truncatedContent}`
    if (url) itemContext += `\nURL: ${url}`
    if (tags.length > 0) itemContext += `\nTags: ${tags.join(', ')}`

    const response = await getOpenAIClient().responses.create({
      model: AI_MODEL,
      instructions: 'You are a developer tool assistant. Generate a concise 1-2 sentence description/summary for the given item. The description should be clear, informative, and useful for quickly understanding what the item is about. Return a JSON object with a "description" key containing the description string.',
      input: `Write a concise 1-2 sentence description for this developer item. Respond in json format.\n\n${itemContext}`,
      text: {
        format: { type: 'json_object' },
      },
    })

    const text = response.output_text
    const parsed_json = JSON.parse(text)

    const description = typeof parsed_json === 'object' && parsed_json !== null && typeof parsed_json.description === 'string'
      ? parsed_json.description.trim()
      : null

    if (!description) {
      return { success: false, error: 'AI returned an unexpected format' }
    }

    return { success: true, data: { description } }
  } catch (error) {
    console.error('[generateDescription] Error:', error)
    if (error instanceof SyntaxError) {
      return { success: false, error: 'AI returned invalid JSON' }
    }
    return { success: false, error: 'Failed to generate description. Please try again.' }
  }
}

const explainCodeSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  language: z.string().optional().default(''),
  type: z.enum(['snippet', 'command']),
})

export type ExplainCodeInput = z.input<typeof explainCodeSchema>

type ExplainCodeResult =
  | { success: true; data: { explanation: string } }
  | { success: false; error: string }

export async function explainCode(
  input: ExplainCodeInput
): Promise<ExplainCodeResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    if (!session.user.isPro) {
      return { success: false, error: 'AI features require a Pro plan' }
    }

    const parsed = explainCodeSchema.safeParse(input)
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

    const { code, language, type } = parsed.data

    // Truncate code to 2000 chars
    const truncatedCode = code.slice(0, 2000)

    const typeLabel = type === 'command' ? 'terminal command' : 'code snippet'
    const languageHint = language ? ` written in ${language}` : ''

    const response = await getOpenAIClient().responses.create({
      model: AI_MODEL,
      instructions: `You are a developer tool assistant. Explain the given ${typeLabel}${languageHint} in plain English. Cover what it does, key concepts, and any important details. Keep the explanation concise (200-300 words). Use markdown formatting with headings, bullet points, and inline code where appropriate. Return a JSON object with an "explanation" key containing the markdown string.`,
      input: `Explain this ${typeLabel}. Respond in json format.\n\n\`\`\`${language || ''}\n${truncatedCode}\n\`\`\``,
      text: {
        format: { type: 'json_object' },
      },
    })

    const text = response.output_text
    const parsed_json = JSON.parse(text)

    const explanation = typeof parsed_json === 'object' && parsed_json !== null && typeof parsed_json.explanation === 'string'
      ? parsed_json.explanation.trim()
      : null

    if (!explanation) {
      return { success: false, error: 'AI returned an unexpected format' }
    }

    return { success: true, data: { explanation } }
  } catch (error) {
    console.error('[explainCode] Error:', error)
    if (error instanceof SyntaxError) {
      return { success: false, error: 'AI returned invalid JSON' }
    }
    return { success: false, error: 'Failed to explain code. Please try again.' }
  }
}

const optimizePromptSchema = z.object({
  content: z.string().min(1, 'Prompt content is required'),
})

export type OptimizePromptInput = z.input<typeof optimizePromptSchema>

type OptimizePromptResult =
  | { success: true; data: { optimized: string } }
  | { success: false; error: string }

export async function optimizePrompt(
  input: OptimizePromptInput
): Promise<OptimizePromptResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    if (!session.user.isPro) {
      return { success: false, error: 'AI features require a Pro plan' }
    }

    const parsed = optimizePromptSchema.safeParse(input)
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

    const { content } = parsed.data

    // Truncate content to 2000 chars
    const truncatedContent = content.slice(0, 2000)

    const response = await getOpenAIClient().responses.create({
      model: AI_MODEL,
      instructions: 'You are an expert prompt engineer. Optimize the given AI prompt to be clearer, more specific, and more effective. Improve structure, add relevant constraints or context, and refine the language. Keep the original intent intact. Return a JSON object with an "optimized" key containing the optimized prompt string.',
      input: `Optimize this AI prompt. Respond in json format.\n\n${truncatedContent}`,
      text: {
        format: { type: 'json_object' },
      },
    })

    const text = response.output_text
    const parsed_json = JSON.parse(text)

    const optimized = typeof parsed_json === 'object' && parsed_json !== null && typeof parsed_json.optimized === 'string'
      ? parsed_json.optimized.trim()
      : null

    if (!optimized) {
      return { success: false, error: 'AI returned an unexpected format' }
    }

    return { success: true, data: { optimized } }
  } catch (error) {
    console.error('[optimizePrompt] Error:', error)
    if (error instanceof SyntaxError) {
      return { success: false, error: 'AI returned invalid JSON' }
    }
    return { success: false, error: 'Failed to optimize prompt. Please try again.' }
  }
}

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
