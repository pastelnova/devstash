'use client'

import { useCallback, useRef, useState } from 'react'
import { Upload, X, FileIcon, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/utils'

interface UploadResult {
  key: string
  fileName: string
  fileSize: number
  contentType: string
}

interface FileUploadProps {
  type: 'file' | 'image'
  onUploaded: (result: UploadResult) => void
  onRemove: () => void
  uploaded: UploadResult | null
}

const IMAGE_ACCEPT = '.png,.jpg,.jpeg,.gif,.webp,.svg'
const FILE_ACCEPT = '.pdf,.txt,.md,.json,.yaml,.yml,.xml,.csv,.toml,.ini'

export function FileUpload({ type, onUploaded, onRemove, uploaded }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isImage = type === 'image'
  const accept = isImage ? IMAGE_ACCEPT : FILE_ACCEPT
  const maxSizeMB = isImage ? 5 : 10

  const upload = useCallback(
    async (file: File) => {
      setError(null)
      setUploading(true)
      setProgress(0)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      try {
        const xhr = new XMLHttpRequest()

        const result = await new Promise<UploadResult>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100))
            }
          })

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText) as UploadResult)
            } else {
              const body = JSON.parse(xhr.responseText) as { error?: string }
              reject(new Error(body.error ?? 'Upload failed'))
            }
          })

          xhr.addEventListener('error', () => reject(new Error('Upload failed')))
          xhr.open('POST', '/api/upload')
          xhr.send(formData)
        })

        onUploaded(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setUploading(false)
        setProgress(0)
      }
    },
    [type, onUploaded],
  )

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      upload(files[0])
    },
    [upload],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  if (uploaded) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-input bg-muted/30 p-3">
        {isImage ? (
          <ImageIcon className="h-5 w-5 text-muted-foreground shrink-0" />
        ) : (
          <FileIcon className="h-5 w-5 text-muted-foreground shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{uploaded.fileName}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(uploaded.fileSize)}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={() => {
            onRemove()
            if (inputRef.current) inputRef.current.value = ''
          }}
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-input hover:border-muted-foreground/50'
        }`}
      >
        {uploading ? (
          <>
            <div className="relative h-10 w-10">
              <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  className="stroke-muted"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="3"
                  strokeDasharray={`${progress * 0.975} 97.5`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium">
                {progress}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Uploading…</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">
                Drop {isImage ? 'an image' : 'a file'} here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max {maxSizeMB} MB
              </p>
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
