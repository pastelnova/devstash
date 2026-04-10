'use client'

import {
  FileText,
  FileCode,
  FileImage,
  FileArchive,
  FileSpreadsheet,
  File,
  Download,
} from 'lucide-react'
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
  const ext = getExtension(item.fileName)
  const Icon = EXT_ICON_MAP[ext] ?? File
  const color = item.type.color ?? '#94a3b8'

  const date = new Date(item.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <button
      type="button"
      onClick={() => openItem(item.id)}
      className="flex items-center gap-3 rounded-lg border border-l-4 bg-card px-4 py-3 hover:bg-muted/30 transition-colors text-left w-full cursor-pointer"
      style={{ borderLeftColor: color }}
    >
      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />

      {/* Name — takes remaining space */}
      <span className="flex-1 min-w-0 truncate text-sm font-medium">
        {item.fileName ?? item.title}
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
