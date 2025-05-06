'use client'

import { usePathname } from 'next/navigation'
import React from 'react'
import AuthModeToggle from '../auth-mode-toggle'

// Define workspace interface to match the client-workspace-layout
interface WorkspaceType {
  id: string
  name: string
  type: string
  [key: string]: any
}

type Props = {
  workspace: WorkspaceType
}

const GlobalHeader = ({ workspace }: Props) => {
  //Pathname
  const pathName = usePathname().split(`/dashboard/${workspace.id}`)[1]
  return (
    <article className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground text-xs">
          {pathName.includes('video') ? '' : workspace.type.toLocaleUpperCase()}
        </span>
        <AuthModeToggle />
      </div>
      <h1 className="text-4xl font-bold">
        {pathName && !pathName.includes('folder') && !pathName.includes('video')
          ? pathName.charAt(1).toUpperCase() + pathName.slice(2).toLowerCase()
          : pathName.includes('video')
          ? ''
          : 'My Library'}
      </h1>
    </article>
  )
}

export default GlobalHeader
