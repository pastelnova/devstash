import { Code2, Sparkles, Terminal, FileText, File, Image, Link as LinkIcon } from 'lucide-react'
import { mockItemTypes } from '@/lib/mock-data'

const typeIconMap: Record<string, React.ElementType> = {
  code: Code2,
  sparkles: Sparkles,
  terminal: Terminal,
  'file-text': FileText,
  file: File,
  image: Image,
  link: LinkIcon,
}

interface Item {
  id: string
  title: string
  description?: string | null
  typeId: string
  tags: string[]
  createdAt: string
}

export function ItemRow({ item }: { item: Item }) {
  const type = mockItemTypes.find((t) => t.id === item.typeId)
  const Icon = type ? (typeIconMap[type.icon] ?? File) : File
  const iconColor = type?.color ?? '#94a3b8'

  const date = new Date(item.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div
        className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: `${iconColor}22` }}
      >
        <Icon className="h-4 w-4" style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug">{item.title}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
        )}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.tags.map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <time className="text-xs text-muted-foreground shrink-0 mt-0.5">{date}</time>
    </div>
  )
}
