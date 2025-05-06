'use client'
import { Button } from '@/components/ui/button'
import { useCreateFolders } from '@/hooks/useCreateFolders'
import React from 'react'
import { Plus } from 'lucide-react'

type Props = { workspaceId: string }

const CreateForlders = ({ workspaceId }: Props) => {
  const { onCreateNewFolder } = useCreateFolders(workspaceId)

  return (
    <Button
      onClick={onCreateNewFolder}
      className="sleek-border bg-card hover:bg-secondary/20 text-foreground hover:text-primary transition-all elevation-2"
    >
      <Plus className="h-4 w-4 mr-2 text-primary" />
      Create Folder
    </Button>
  )
}

export default CreateForlders
