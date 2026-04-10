import { File } from 'lucide-react'
import { typeIconMap } from '@/lib/item-type-icons'
import type { ItemDetail } from '@/lib/db/items'

export const CONTENT_TYPES = new Set(['snippet', 'prompt', 'command', 'note'])
export const LANGUAGE_TYPES = new Set(['snippet', 'command'])
export const URL_TYPES = new Set(['link'])
export const FILE_VIEW_TYPES = new Set(['file', 'image'])

export function TypeIconBadge({ item }: { item: ItemDetail }) {
  const Icon = item.type.icon ? (typeIconMap[item.type.icon] ?? File) : File
  const iconColor = item.type.color ?? '#94a3b8'
  return (
    <div
      className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
      style={{ backgroundColor: `${iconColor}22` }}
    >
      <Icon className="h-5 w-5" style={{ color: iconColor }} />
    </div>
  )
}

export function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
