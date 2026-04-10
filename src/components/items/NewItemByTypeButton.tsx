'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOpenCreateDialog } from '@/components/dashboard/DashboardShell'

interface NewItemByTypeButtonProps {
  typeName: string
}

export function NewItemByTypeButton({ typeName }: NewItemByTypeButtonProps) {
  const openCreate = useOpenCreateDialog()

  return (
    <Button size="sm" className="gap-1.5" onClick={openCreate}>
      <Plus className="h-4 w-4" />
      New {typeName}
    </Button>
  )
}
