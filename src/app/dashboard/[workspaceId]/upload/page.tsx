'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import VideoUploader from '@/components/global/videos/VideoUploader'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const UploadPage = () => {
  const { workspaceId } = useParams()
  const { user } = useCurrentUser()
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading user data...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link 
          href={`/dashboard/${workspaceId}`}
          className="flex items-center gap-2 text-sm hover:underline"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Upload New Video</h1>
        <p className="text-sm text-gray-600 mb-6">
          Create a new video by recording from your webcam or uploading a file
        </p>
        
        <Separator className="mb-8" />
        
        <VideoUploader 
          userId={user.id} 
          workspaceId={workspaceId as string} 
        />
        
        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-3">Video Upload Tips</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
            <li>For better quality, ensure good lighting and minimize background noise</li>
            <li>Videos must be under 100MB in size</li>
            <li>Supported formats: MP4, WebM, and MOV</li>
            <li>Recording from webcam automatically processes the video for you</li>
            <li>Uploaded files will be processed and available in your workspace</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default UploadPage 