export const mockUser = {
  id: "user_1",
  name: "John Doe",
  email: "demo@devstash.io",
  isPro: true,
};

export const mockItemTypes = [
  { id: "type_snippet",  name: "Snippets",  icon: "code",      color: "#a78bfa", count: 24 },
  { id: "type_prompt",   name: "Prompts",   icon: "sparkles",  color: "#60a5fa", count: 18 },
  { id: "type_command",  name: "Commands",  icon: "terminal",  color: "#34d399", count: 15 },
  { id: "type_note",     name: "Notes",     icon: "file-text", color: "#fbbf24", count: 12 },
  { id: "type_file",     name: "Files",     icon: "file",      color: "#f87171", count: 5  },
  { id: "type_image",    name: "Images",    icon: "image",     color: "#fb923c", count: 3  },
  { id: "type_url",      name: "Links",     icon: "link",      color: "#38bdf8", count: 8  },
];

export const mockCollections = [
  {
    id: "col_1",
    name: "React Patterns",
    description: "Common React patterns and hooks",
    itemCount: 12,
    isFavorite: true,
    icons: ["code", "sparkles", "link"],
  },
  {
    id: "col_2",
    name: "Python Snippets",
    description: "Useful Python code snippets",
    itemCount: 8,
    isFavorite: false,
    icons: ["code", "file"],
  },
  {
    id: "col_3",
    name: "Context Files",
    description: "AI context files for projects",
    itemCount: 5,
    isFavorite: true,
    icons: ["file", "image"],
  },
  {
    id: "col_4",
    name: "Interview Prep",
    description: "Technical interview preparation",
    itemCount: 24,
    isFavorite: false,
    icons: ["code", "sparkles", "link", "file-text"],
  },
  {
    id: "col_5",
    name: "Git Commands",
    description: "Frequently used git commands",
    itemCount: 15,
    isFavorite: true,
    icons: ["terminal", "file"],
  },
  {
    id: "col_6",
    name: "AI Prompts",
    description: "Curated AI prompts for coding",
    itemCount: 18,
    isFavorite: false,
    icons: ["sparkles", "code"],
  },
];

export const mockItems = [
  {
    id: "item_1",
    title: "useAuth Hook",
    description: "Custom authentication hook for React applications",
    typeId: "type_snippet",
    collectionId: "col_1",
    language: "typescript",
    tags: ["react", "auth", "hooks"],
    isFavorite: false,
    isPinned: true,
    createdAt: "2025-01-15",
    content: `import { useSession } from 'next-auth/react'

export function useAuth() {
  const { data: session, status } = useSession()
  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  }
}`,
  },
  {
    id: "item_2",
    title: "API Error Handling Pattern",
    description: "Fetch wrapper with exponential backoff retry logic",
    typeId: "type_snippet",
    collectionId: "col_1",
    language: "typescript",
    tags: ["api", "error-handling", "fetch"],
    isFavorite: false,
    isPinned: true,
    createdAt: "2025-01-12",
    content: `async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(res.statusText)
      return await res.json()
    } catch (e) {
      if (i === retries - 1) throw e
      await new Promise(r => setTimeout(r, 2 ** i * 1000))
    }
  }
}`,
  },
  {
    id: "item_3",
    title: "Git Commit Convention",
    description: "Conventional commits cheat sheet",
    typeId: "type_command",
    collectionId: "col_5",
    language: null,
    tags: ["git", "workflow"],
    isFavorite: true,
    isPinned: false,
    createdAt: "2025-01-10",
    content: `feat: new feature
fix: bug fix
chore: maintenance
docs: documentation
refactor: code change without fix/feature
test: adding tests`,
  },
  {
    id: "item_4",
    title: "Next.js Server Action Template",
    description: "Boilerplate for a type-safe server action",
    typeId: "type_snippet",
    collectionId: "col_1",
    language: "typescript",
    tags: ["nextjs", "server-actions"],
    isFavorite: true,
    isPinned: false,
    createdAt: "2025-01-08",
    content: `'use server'

export async function myAction(formData: FormData) {
  try {
    // logic here
    return { success: true, data: null }
  } catch (error) {
    return { success: false, error: 'Something went wrong' }
  }
}`,
  },
  {
    id: "item_5",
    title: "Explain this code",
    description: "Prompt for getting plain-English code explanations",
    typeId: "type_prompt",
    collectionId: "col_6",
    language: null,
    tags: ["ai", "code-review"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2025-01-05",
    content: `Explain the following code in plain English. Describe what it does, how it works, and any potential issues:\n\n\`\`\`\n{{code}}\n\`\`\``,
  },
  {
    id: "item_6",
    title: "Docker Compose Dev Stack",
    description: "Postgres + Redis local dev environment",
    typeId: "type_file",
    collectionId: "col_2",
    language: "yaml",
    tags: ["docker", "devops"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2025-01-03",
    content: null,
    fileUrl: "/files/docker-compose.yml",
    fileName: "docker-compose.yml",
  },
];
