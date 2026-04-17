import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { uploadToR2 } from '@/lib/r2'
import crypto from 'crypto'

const IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
])

const FILE_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/json',
  'application/x-yaml',
  'text/yaml',
  'application/xml',
  'text/xml',
  'text/csv',
  'application/toml',
])

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'])
const FILE_EXTENSIONS = new Set(['.pdf', '.txt', '.md', '.json', '.yaml', '.yml', '.xml', '.csv', '.toml', '.ini'])

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot === -1 ? '' : filename.slice(dot).toLowerCase()
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const itemType = formData.get('type') as string | null // "file" or "image"

  if (!file || !itemType) {
    return NextResponse.json({ error: 'File and type are required' }, { status: 400 })
  }

  // File uploads are Pro only; images are allowed for free users
  if (itemType === 'file' && !(session.user.isPro ?? false)) {
    return NextResponse.json(
      { error: 'File uploads require a Pro plan' },
      { status: 403 },
    )
  }

  const ext = getExtension(file.name)
  const isImage = itemType === 'image'

  // Validate extension
  const validExtensions = isImage ? IMAGE_EXTENSIONS : FILE_EXTENSIONS
  if (!validExtensions.has(ext)) {
    return NextResponse.json(
      { error: `Invalid file extension: ${ext}` },
      { status: 400 },
    )
  }

  // Validate MIME type
  const validMimeTypes = isImage ? IMAGE_MIME_TYPES : FILE_MIME_TYPES
  if (!validMimeTypes.has(file.type)) {
    return NextResponse.json(
      { error: `Invalid file type: ${file.type}` },
      { status: 400 },
    )
  }

  // Validate size
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE
  if (file.size > maxSize) {
    const limitMB = maxSize / (1024 * 1024)
    return NextResponse.json(
      { error: `File exceeds ${limitMB} MB limit` },
      { status: 400 },
    )
  }

  // Generate unique key: userId/type/randomId.ext
  const id = crypto.randomUUID()
  const key = `${session.user.id}/${itemType}s/${id}${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  await uploadToR2(key, buffer, file.type)

  return NextResponse.json({
    key,
    fileName: file.name,
    fileSize: file.size,
    contentType: file.type,
  })
}
