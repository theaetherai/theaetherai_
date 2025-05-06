'use client'

import { useState, useEffect } from 'react'
import CloudinaryVideoUploader from '@/components/global/videos/CloudinaryVideoUploader'
import { useUser } from '@clerk/nextjs'
import { getUserProfile } from '@/actions/user'

export default function TestUploaderPage() {
  const { user } = useUser()
  const [dbUserId, setDbUserId] = useState<string | null>(null)
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null)
  
  // Use useEffect to fetch the database user ID when component mounts
  useEffect(() => {
    if (user && !dbUserId) {
      getUserProfile().then((result: any) => {
        if (result?.status === 200 && result.data?.id) {
          setDbUserId(result.data.id)
        }
      })
    }
  }, [user, dbUserId])
  
  const handleUploadComplete = (videoId: string | any) => {
    console.log('Upload completed:', videoId)
    // Ensure we're handling either a string or an object properly
    if (typeof videoId === 'object' && videoId !== null) {
      setUploadedVideoId(videoId.id || JSON.stringify(videoId))
    } else {
      setUploadedVideoId(String(videoId))
    }
  }
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Test Cloudinary Uploader</h1>
      
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">User Information</h2>
        <p><strong>Clerk ID:</strong> {user?.id || 'Not signed in'}</p>
        <p><strong>Database ID:</strong> {dbUserId || 'Not available'}</p>
      </div>
      
      {uploadedVideoId && (
        <div className="mb-6 p-4 border border-green-300 rounded bg-green-50">
          <h2 className="text-lg font-semibold mb-2">Upload Success</h2>
          <p><strong>Video ID:</strong> {uploadedVideoId}</p>
          <button 
            onClick={() => setUploadedVideoId(null)}
            className="px-4 py-2 bg-blue-500 text-white rounded mt-2"
          >
            Reset
          </button>
        </div>
      )}
      
      <CloudinaryVideoUploader 
        userId={dbUserId || ''} 
        workspaceId={'personal'} 
        clerkId={user?.id} 
        onUploadComplete={handleUploadComplete}
      />
    </div>
  )
} 