'use client'
import FolderDuotone from '@/components/icons/folder-duotone'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import Folder from './folder'
import { useQueryData } from '@/hooks/useQueryData'
import { getWorkspaceFolders } from '@/actions/workspace'
import { useMutationDataState } from '@/hooks/useMutationData'
import Videos from '../videos'
import { useDispatch } from 'react-redux'
import { FOLDERS } from '@/redux/slices/folders'

type Props = {
  workspaceId: string
}

export type FoldersProps = {
  status: number
  data: ({
    _count: {
      videos: number
    }
  } & {
    id: string
    name: string
    createdAt: Date
    workSpaceId: string | null
  })[]
}

const Folders = ({ workspaceId }: Props) => {
  const dispatch = useDispatch()
  //get folders
  const { data, isFetched } = useQueryData(['workspace-folders'], () =>
    getWorkspaceFolders(workspaceId)
  )

  const { latestVariables } = useMutationDataState(['create-folder'])

  const { status, data: folders } = data as FoldersProps

  if (isFetched && folders) {
    dispatch(FOLDERS({ folders: folders }))
  }

  return (
    <div
      className="flex flex-col gap-6"
      suppressHydrationWarning
    >
      {/* Categories Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-udemy-heading">Categories</h2>
          <button className="text-udemy-purple hover:text-udemy-purple/80 flex items-center gap-2 text-sm">
            <span>See all</span>
            <ArrowRight size={16} />
          </button>
        </div>
        <div
          className={cn(
            status !== 200 && 'justify-center',
            'flex items-center gap-4 overflow-x-auto pb-4'
          )}
        >
          {status !== 200 ? (
            <p className="text-udemy-text py-4">No categories found</p>
          ) : (
            <>
              {latestVariables && latestVariables.status === 'pending' && (
                <Folder
                  name={latestVariables.variables.name}
                  id={latestVariables.variables.id}
                  optimistic
                />
              )}
              {folders.map((folder) => (
                <Folder
                  name={folder.name}
                  count={folder._count.videos}
                  id={folder.id}
                  key={folder.id}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Videos Section */}
      <div className="mt-2">
        <Videos
          workspaceId={workspaceId}
          folderId={workspaceId}
          videosKey="user-videos"
        />
      </div>
    </div>
  )
}

export default Folders
