'use client'

import { FolderOpen, X } from 'lucide-react'

export type CollectionOption = {
  id: string
  name: string
}

interface CollectionSelectProps {
  collections: CollectionOption[]
  selected: string[]
  onChange: (ids: string[]) => void
}

export function CollectionSelect({ collections, selected, onChange }: CollectionSelectProps) {
  const selectedSet = new Set(selected)
  const available = collections.filter((c) => !selectedSet.has(c.id))

  const add = (id: string) => onChange([...selected, id])
  const remove = (id: string) => onChange(selected.filter((s) => s !== id))

  return (
    <div className="space-y-2">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id) => {
            const col = collections.find((c) => c.id === id)
            if (!col) return null
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
              >
                <FolderOpen className="h-3 w-3 text-muted-foreground" />
                {col.name}
                <button
                  type="button"
                  onClick={() => remove(id)}
                  className="ml-0.5 rounded hover:bg-muted-foreground/20 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Dropdown to add */}
      {available.length > 0 && (
        <select
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          value=""
          onChange={(e) => {
            if (e.target.value) add(e.target.value)
          }}
        >
          <option value="">Add to collection…</option>
          {available.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
