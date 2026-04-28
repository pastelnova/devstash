# AI Integration Plan

## Overview

This document outlines the implementation plan for integrating OpenAI's GPT-5-nano model into the DevStash application. The integration will enable AI-powered features including auto-tagging, content summaries, code explanations, and prompt optimization while maintaining security, performance, and cost efficiency.

## Architecture

### Tech Stack

- **OpenAI SDK**: `openai` package for direct API integration
- **AI SDK**: Vercel's `@ai-sdk/openai` for enhanced Next.js integration
- **Next.js Server Actions**: For secure server-side AI processing
- **Streaming**: Real-time response streaming for better UX
- **Rate Limiting**: Upstash Redis for API call throttling
- **Pro Gating**: Feature access control based on subscription tier

## Implementation Components

### 1. OpenAI SDK Setup

#### Installation

```bash
npm install openai @ai-sdk/openai
```

#### Configuration

```typescript
// src/lib/openai.ts
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// For AI SDK integration
import { openai as aiSdkOpenai } from "@ai-sdk/openai";
```

#### Environment Variables

```env
OPENAI_API_KEY=sk-proj-...
```

### 2. Server Action Patterns

Following the existing codebase patterns:

```typescript
// src/actions/ai.ts
"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { openai } from "@/lib/openai";
import { canUseAI } from "@/lib/plan-limits";
import { rateLimit } from "@/lib/rate-limit";

const generateSummarySchema = z.object({
  content: z.string().min(1).max(10000),
  type: z.enum(["snippet", "prompt", "note"]),
});

export type GenerateSummaryInput = z.input<typeof generateSummarySchema>;

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function generateSummary(
  input: GenerateSummaryInput,
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = generateSummarySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  // Pro user check
  const allowed = await canUseAI(session.user.id, session.user.isPro ?? false);
  if (!allowed) {
    return { success: false, error: "AI features require Pro subscription" };
  }

  // Rate limiting
  const { success } = await rateLimit.ai.limit(session.user.id);
  if (!success) {
    return {
      success: false,
      error: "Rate limit exceeded. Please try again later.",
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using available model instead of gpt-5-nano
      messages: [
        {
          role: "system",
          content: `Generate a concise summary for a ${parsed.data.type} item.`,
        },
        {
          role: "user",
          content: parsed.data.content,
        },
      ],
      max_tokens: 150,
    });

    return {
      success: true,
      data: completion.choices[0]?.message?.content || "",
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    return { success: false, error: "Failed to generate summary" };
  }
}
```

### 3. Streaming Implementation

For real-time AI responses using AI SDK:

```typescript
// app/api/ai/stream/route.ts
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  const { messages, feature } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages,
    system: getSystemPrompt(feature),
    maxTokens: 1000,
  });

  return result.toUIMessageStreamResponse();
}
```

### 4. Feature Implementations

#### Auto-tagging

```typescript
export async function generateTags(content: string): Promise<string[]> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Generate 3-5 relevant tags for this content: ${content}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
  return result.tags || [];
}
```

#### Code Explanation

```typescript
export async function explainCode(
  code: string,
  language: string,
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Explain this ${language} code in simple terms:\n\n${code}`,
      },
    ],
    max_tokens: 300,
  });

  return completion.choices[0]?.message?.content || "";
}
```

#### Prompt Optimization

```typescript
export async function optimizePrompt(prompt: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an expert at writing effective prompts for AI models.",
      },
      {
        role: "user",
        content: `Optimize this prompt for better AI responses: ${prompt}`,
      },
    ],
    max_tokens: 200,
  });

  return completion.choices[0]?.message?.content || "";
}
```

### 5. Rate Limiting & Cost Optimization

#### Rate Limiting Configuration

```typescript
// src/lib/rate-limit.ts (extend existing)
export const rateLimiters = {
  // ... existing rate limiters
  ai: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(50, "1 h"), // 50 AI calls per hour
        prefix: "rl:ai",
        timeout: 3000,
      })
    : null,
};
```

#### Plan Limits

```typescript
// src/lib/plan-limits.ts (extend existing)
export async function canUseAI(userId: string, isPro: boolean) {
  if (isPro) return true;

  // Free users: 10 AI calls per day
  const today = new Date().toISOString().split("T")[0];
  const count = await prisma.aiUsage.count({
    where: {
      userId,
      date: today,
    },
  });

  return count < 10;
}
```

### 6. UI Patterns

#### Loading States with AI SDK

```typescript
// components/AIButton.tsx
'use client'

import { useActionState } from 'react'
import { generateSummary } from '@/actions/ai'

export function GenerateSummaryButton({ content, type }: { content: string, type: string }) {
  const [state, action, pending] = useActionState(generateSummary, null)

  return (
    <form action={action}>
      <input type="hidden" name="content" value={content} />
      <input type="hidden" name="type" value={type} />
      <button disabled={pending} type="submit">
        {pending ? 'Generating...' : 'Generate Summary'}
      </button>
    </form>
  )
}
```

#### Streaming Chat Interface

```typescript
// components/AIChat.tsx
'use client'

import { useChat } from '@ai-sdk/react'

export function AIChat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/ai/stream'
  })

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          {message.role}: {message.content}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask AI..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}
```

### 7. Error Handling

```typescript
// src/lib/ai-error-handler.ts
import { APIError } from "openai";

export function handleAIError(error: unknown): string {
  if (error instanceof APIError) {
    switch (error.status) {
      case 429:
        return "Rate limit exceeded. Please try again later.";
      case 401:
        return "Invalid API key. Please check your configuration.";
      case 400:
        return "Invalid request. Please check your input.";
      default:
        return "AI service temporarily unavailable.";
    }
  }

  return "An unexpected error occurred.";
}
```

### 8. Security Considerations

#### Input Sanitization

- Use Zod schemas for all AI inputs
- Limit input length to prevent abuse
- Strip potentially harmful content

#### API Key Management

- Store keys in environment variables only
- Never expose keys to client-side code
- Use restricted API keys when possible

#### Content Filtering

- Implement output validation
- Monitor for inappropriate content
- Rate limit based on user behavior

### 9. Cost Optimization Strategies

#### Model Selection

- Use `gpt-4o-mini` for cost-effective responses
- Reserve larger models for complex tasks
- Implement model routing based on task complexity

#### Caching

- Cache frequent AI responses
- Implement semantic caching for similar requests
- Use Redis for response caching

#### Usage Monitoring

- Track API usage per user
- Implement usage dashboards
- Set up cost alerts

### 10. Testing Strategy

#### Unit Tests

```typescript
// src/actions/ai.test.ts
import { generateSummary } from "./ai";
import { vi, describe, it, expect } from "vitest";

vi.mock("@/lib/openai");
vi.mock("@/auth");
vi.mock("@/lib/plan-limits");

describe("generateSummary", () => {
  it("requires authentication", async () => {
    // Test auth failure
  });

  it("validates input", async () => {
    // Test Zod validation
  });

  it("checks plan limits", async () => {
    // Test Pro gating
  });
});
```

#### Mock External Dependencies

- Mock OpenAI API responses
- Mock authentication
- Mock rate limiting
- Never hit real APIs in tests

## Migration Path

1. **Phase 1**: Basic OpenAI integration with server actions
2. **Phase 2**: Add streaming support with AI SDK
3. **Phase 3**: Implement advanced features (tools, RAG)
4. **Phase 4**: Add usage analytics and optimization

## Dependencies

```json
{
  "dependencies": {
    "openai": "^6.34.0",
    "@ai-sdk/openai": "^1.0.0",
    "@ai-sdk/react": "^1.0.0",
    "ai": "^4.0.0"
  }
}
```

## Success Metrics

- Response time < 2 seconds for simple queries
- 99% uptime for AI features
- Cost per user < $0.10/month for free tier
- User satisfaction > 4.5/5 for AI features
