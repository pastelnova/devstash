'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  FileCode,
  FileImage,
  FileArchive,
  FileSpreadsheet,
  File,
  Download,
  Star,
} from 'lucide-react'
import { toast } from 'sonner'
import { toggleItemFavorite } from '@/actions/items'
import type { FileItemMeta } from '@/lib/db/items'
import { formatFileSize } from '@/lib/utils'
import { useItemDrawer } from './ItemDrawerContext'

const EXT_ICON_MAP: Record<string, typeof File> = {
  // Code
  ts: FileCode,
  tsx: FileCode,
  js: FileCode,
  jsx: FileCode,
  py: FileCode,
  rb: FileCode,
  go: FileCode,
  rs: FileCode,
  java: FileCode,
  html: FileCode,
  css: FileCode,
  json: FileCode,
  yaml: FileCode,
  yml: FileCode,
  xml: FileCode,
  // Documents
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  txt: FileText,
  md: FileText,
  // Images
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  svg: FileImage,
  webp: FileImage,
  // Archives
  zip: FileArchive,
  tar: FileArchive,
  gz: FileArchive,
  rar: FileArchive,
  '7z': FileArchive,
  // Spreadsheets
  csv: FileSpreadsheet,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
}

function getExtension(fileName: string | null): string {
  if (!fileName) return ''
  const dot = fileName.lastIndexOf('.')
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : ''
}

export function FileRow({ item }: { item: FileItemMeta }) {
  const { openItem } = useItemDrawer()
  const router = useRouter()
  const ext = getExtension(item.fileName)
  const Icon = EXT_ICON_MAP[ext] ?? File
  const color = item.type.color ?? '#94a3b8'
  const [isFavorite, setIsFavorite] = useState(item.isFavorite)
  useEffect(() => setIsFavorite(item.isFavorite), [item.isFavorite])
  const [, startFavTransition] = useTransition()

  const date = new Date(item.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    startFavTransition(async () => {
      const result = await toggleItemFavorite(item.id)
      if (result.success) {
        setIsFavorite(result.data.isFavorite)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={() => openItem(item.id)}
      className="group flex items-center gap-3 rounded-lg border border-l-4 bg-card px-4 py-3 hover:bg-muted/30 transition-colors text-left w-full cursor-pointer"
      style={{ borderLeftColor: color }}
    >
      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />

      {/* Name — takes remaining space */}
      <span className="flex-1 min-w-0 flex items-center gap-1.5">
        <span className="truncate text-sm font-medium">{item.fileName ?? item.title}</span>
        <span
          role="button"
          tabIndex={0}
          onClick={handleToggleFavorite}
          onKeyDown={(e) => { if (e.key === 'Enter') handleToggleFavorite(e as unknown as React.MouseEvent) }}
          className={`shrink-0 rounded-md p-0.5 hover:bg-muted transition-all ${isFavorite ? '' : 'opacity-0 group-hover:opacity-100'}`}
          title={isFavorite ? 'Unfavorite' : 'Favorite'}
        >
          <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
        </span>
      </span>

      {/* Meta: size, date, download — hidden on small screens, stacked on md */}
      <span className="hidden sm:flex items-center gap-4 shrink-0 text-xs text-muted-foreground">
        <span className="w-20 text-right">{formatFileSize(item.fileSize)}</span>
        <time className="w-28 text-right">{date}</time>
      </span>

      <a
        href={`/api/download/${item.id}`}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 rounded-md p-1.5 hover:bg-muted transition-colors"
        title="Download"
        download
      >
        <Download className="h-4 w-4 text-muted-foreground" />
      </a>
    </button>
  )
}
