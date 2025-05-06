'use client'

import { useState, useEffect } from 'react'
import CloudinaryVideoUploader from '@/components/global/videos/CloudinaryVideoUploader'
import { useUser } from '@clerk/nextjs'
import { getUserProfile } from '@/actions/user'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CloudinaryUploaderPage({
  params,
}: {
  params: { workspaceId: string }
}) {
  const { user } = useUser()
  const [dbUserId, setDbUserId] = useState<string | null>(null)
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null)
  const router = useRouter()
  
  // Use useEffect to fetch the database user ID when component mounts
  useEffect(() => {
    if (user) {
      getUserProfile().then((result: any) => {
        if (result?.status === 200 && result.data?.id) {
          setDbUserId(result.data.id)
        }
      })
    }
  }, [user])
  
  const handleUploadComplete = (videoId: string | any) => {
    console.log('Upload completed:', videoId)
    // Ensure we're handling either a string or an object properly
    if (videoId === null || videoId === undefined) {
      console.error('Received null or undefined videoId')
      setUploadedVideoId('Unknown ID')
      return
    }
    
    try {
      if (typeof videoId === 'object') {
        // If it's an object, try to extract the id or stringify it
        const idString = videoId.id ? String(videoId.id) : JSON.stringify(videoId)
        console.log('Converted object videoId to string:', idString)
        setUploadedVideoId(idString)
      } else {
        // Otherwise convert to string
        setUploadedVideoId(String(videoId))
      }
    } catch (error) {
      console.error('Error processing videoId:', error)
      setUploadedVideoId('Error: Invalid ID format')
    }
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center">
        <Button 
          variant="ghost" 
          onClick={() => router.push(`/dashboard/${params.workspaceId}`)}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Cloudinary Video Uploader</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">User Information</h2>
          <p><strong>Clerk ID:</strong> {user?.id || 'Not signed in'}</p>
          <p><strong>Database ID:</strong> {dbUserId || 'Loading...'}</p>
          <p><strong>Workspace ID:</strong> {params.workspaceId}</p>
        </div>
        
        {uploadedVideoId && (
          <div className="mb-6 p-4 border border-green-300 rounded bg-green-50">
            <h2 className="text-lg font-semibold mb-2">Upload Success</h2>
            <p><strong>Video ID:</strong> {uploadedVideoId}</p>
            <div className="flex gap-2 mt-2">
              <Button 
                onClick={() => setUploadedVideoId(null)}
                variant="outline"
              >
                Upload Another
              </Button>
              <Button 
                onClick={() => router.push(`/dashboard/${params.workspaceId}`)}
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        )}
        
        <CloudinaryVideoUploader 
          userId={dbUserId || ''} 
          workspaceId={params.workspaceId} 
          clerkId={user?.id} 
          onUploadComplete={handleUploadComplete}
        />
      </div>
    </div>
  )
} 