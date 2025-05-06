'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { EnhancedVideoUploader } from '@/components/global/videos/enhanced'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

/**
 * Enhanced Upload Page
 * Uses the improved video upload component with better resilience
 */
const EnhancedUploadPage = () => {
  const { workspaceId } = useParams()
  const router = useRouter()

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
        <h1 className="text-2xl font-bold mb-2">Enhanced Video Upload</h1>
        <p className="text-sm text-gray-600 mb-6">
          Create a new video by recording from your webcam or uploading a file with improved resilience
        </p>
        
        <Alert variant="info" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Enhanced Uploader</AlertTitle>
          <AlertDescription>
            This page uses our enhanced video uploader with better connectivity handling, 
            adaptive chunk sizing, and improved error recovery.
          </AlertDescription>
        </Alert>
        
        <Separator className="mb-8" />
        
        <EnhancedVideoUploader 
          workspaceId={workspaceId as string}
        />
        
        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-3">Enhanced Upload Features</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
            <li>Adaptive chunk sizing based on network conditions</li>
            <li>Automatic retry for failed uploads</li>
            <li>Improved progress tracking and feedback</li>
            <li>Better handling of connection interruptions</li>
            <li>Drag and drop support for file uploads</li>
            <li>Warning before leaving page during active uploads</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default EnhancedUploadPage 