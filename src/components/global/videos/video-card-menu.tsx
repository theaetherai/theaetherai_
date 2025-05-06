import React, { useState } from 'react'
import Modal from '../modal'
import { AlertTriangle, Move, MoreVertical, Trash } from 'lucide-react'
import ChangeVideoLocation from '@/components/forms/change-video-location'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import axios from 'axios'

type Props = {
  videoId: string
  currentWorkspace?: string
  currentFolder?: string
  currentFolderName?: string
}

const CardMenu = ({
  videoId,
  currentFolder,
  currentFolderName,
  currentWorkspace,
}: Props) => {
  const { toast } = useToast()
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await axios.delete(`/api/videos/${videoId}`)
      
      toast({
        title: 'Video deleted',
        description: 'The video has been successfully deleted',
      })
      
      // Refresh the current page to update the UI
      router.refresh()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete video',
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteAlert(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Open menu">
            <MoreVertical size={16} className="text-gray-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <Modal
            className="p-0 w-full"
            title="Move to new Workspace/Folder"
            description="Select a new location for this video"
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                <Move size={16} className="mr-2 text-gray-500" />
                <span>Move</span>
              </DropdownMenuItem>
            }
          >
            <ChangeVideoLocation
              currentFolder={currentFolder}
              currentWorkSpace={currentWorkspace}
              videoId={videoId}
              currentFolderName={currentFolderName}
            />
          </Modal>
          
          <DropdownMenuItem 
            className="cursor-pointer text-red-500 focus:text-red-500"
            onSelect={() => setShowDeleteAlert(true)}
          >
            <Trash size={16} className="mr-2" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Video
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this video. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default CardMenu
