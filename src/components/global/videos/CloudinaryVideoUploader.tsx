'use client'

import { useState, useRef } from 'react'
import { Camera, UploadCloud, Loader2 } from 'lucide-react'
import axios from 'axios'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CloudinaryVideoUploaderProps {
  userId: string
  workspaceId: string
  clerkId?: string
  className?: string
  onUploadComplete?: (videoId: string) => void
}

type UploadStatus = 'idle' | 'preparing' | 'uploading' | 'processing' | 'success' | 'error'

/**
 * CloudinaryVideoUploader component for direct uploads to Cloudinary
 * Supports file selection, drag and drop, and progress tracking
 */
const CloudinaryVideoUploader: React.FC<CloudinaryVideoUploaderProps> = ({ 
  userId, 
  workspaceId,
  clerkId,
  className,
  onUploadComplete
}) => {
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const dropAreaRef = useRef<HTMLDivElement>(null)
  
  // State
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeTab, setActiveTab] = useState('upload')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [uploadedVideoId, setUploadedVideoId] = useState('')
  
  const { toast } = useToast()
  
  // Setup webcam
  const setupWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      
      setStream(mediaStream)
      setPermissionGranted(true)
    } catch (error) {
      console.error('Error accessing webcam:', error)
      setErrorMessage('Could not access your camera or microphone. Please check permissions.')
    }
  }
  
  // Handle file selection
  const handleFileSelection = (file: File) => {
    // Validate file type
    const validTypes = ['video/webm', 'video/mp4', 'video/quicktime', 'video/x-matroska']
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Invalid file type. Please upload WebM, MP4, MOV, or MKV files.')
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a supported video format.'
      })
      return
    }
    
    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024 // 100MB in bytes
    if (file.size > maxSize) {
      setErrorMessage('File is too large. Maximum size is 100MB.')
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Maximum file size is 100MB.'
      })
      return
    }
    
    setFile(file)
    setErrorMessage('')
  }
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0])
    }
  }
  
  // Handle drag and drop events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0])
    }
  }
  
  // Upload file directly to Cloudinary
  const uploadToCloudinary = async () => {
    if (!file) return
    
    try {
      setStatus('preparing')
      console.log('Starting Cloudinary upload process...')
      
      // Get signature from our API
      console.log('Requesting upload signature with params:', {
        userId: userId || clerkId,
        workspaceId
      })
      const { data } = await axios.get('/api/videos/get-upload-signature', {
        params: { 
          userId: userId || clerkId,
          workspaceId 
        }
      })
      
      console.log('Received signature data:', {
        cloudName: data.cloudName,
        apiKey: data.apiKey?.substring(0, 5) + '...',
        hasSignature: !!data.signature,
        publicId: data.public_id,
        folder: data.folder
      })
      
      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', data.apiKey)
      formData.append('timestamp', data.timestamp)
      formData.append('signature', data.signature)
      formData.append('folder', data.folder)
      formData.append('public_id', data.public_id)
      formData.append('upload_preset', 'video_uploads')
      
      // Add context using the exact same value the server used for signature generation
      if (data.context) {
        formData.append('context', data.context)
        console.log('Using server-provided context:', data.context)
      } else {
        // Fallback - only if server didn't provide context
        const contextData = {
          userId: userId || clerkId || 'anonymous',
          workspaceId,
          source: 'opal-webprodigies',
          uploadedAt: new Date().toISOString()
        }
        formData.append('context', JSON.stringify(contextData))
        console.log('WARNING: Using client-generated context (may cause signature mismatch):', contextData)
      }
      
      // Upload to Cloudinary
      setStatus('uploading')
      console.log('Starting direct upload to Cloudinary...')
      const uploadUrl = `https://api.cloudinary.com/v1_1/${data.cloudName}/video/upload`
      console.log('Upload URL:', uploadUrl)
      
      const uploadResponse = await axios.post(
        uploadUrl,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
              setProgress(percentCompleted)
              if (percentCompleted % 20 === 0) {
                console.log(`Upload progress: ${percentCompleted}%`)
              }
            }
          },
        }
      )
      
      console.log('Cloudinary upload complete. Response:', JSON.stringify(uploadResponse.data, null, 2))
      
      // Notify our API about the successful upload
      console.log('Notifying our API about the upload completion...')
      const completionResponse = await axios.post('/api/videos/completed', {
        videoId: uploadResponse.data.public_id,
        userId: userId || clerkId,
        workspaceId,
        url: uploadResponse.data.secure_url,
        format: uploadResponse.data.format,
        duration: uploadResponse.data.duration
      })
      
      console.log('Upload registered with API. Response:', JSON.stringify(completionResponse.data, null, 2))
      
      setStatus('success')
      // Ensure we're storing a string and not an object
      if (typeof completionResponse.data.id === 'object') {
        console.log('Warning: Received an object instead of a string for video ID', completionResponse.data.id)
        setUploadedVideoId(JSON.stringify(completionResponse.data.id))
      } else {
        setUploadedVideoId(String(completionResponse.data.id || ''))
      }
      
      toast({
        title: 'Upload Successful',
        description: 'Your video has been uploaded and is now processing.'
      })
      
      // Call the onUploadComplete callback with the video ID if provided
      if (onUploadComplete) {
        // Ensure we're passing a string, not an object
        const videoId = typeof completionResponse.data.id === 'object' 
          ? JSON.stringify(completionResponse.data.id)
          : String(completionResponse.data.id || '')
        onUploadComplete(videoId)
      }
    } catch (error: any) {
      console.error('Upload failed. Error details:', error)
      if (error.response) {
        console.error('Error response data:', error.response.data)
        console.error('Error response status:', error.response.status)
      }
      setStatus('error')
      // Ensure error message is always a string
      setErrorMessage(typeof error.response?.data?.error === 'object' 
        ? JSON.stringify(error.response?.data?.error) 
        : String(error.response?.data?.error || error.message || 'Upload failed'))
      
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'There was an error uploading your video. Please check the console for details.'
      })
    }
  }
  
  // Record from webcam
  const startRecording = async () => {
    // If we don't have permission yet, try to set up webcam
    if (!permissionGranted) {
      await setupWebcam()
    }
    
    // Implementation for webcam recording would go here
    // For this version, we'll just show an alert
    toast({
      title: 'Webcam Recording',
      description: 'Webcam recording will be implemented in a future update.'
    })
  }
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    
    if (tab === 'webcam' && !permissionGranted) {
      setupWebcam()
    }
  }
  
  // Render appropriate content based on status
  const renderContent = () => {
    switch (status) {
      case 'uploading':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2 w-full max-w-md">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm font-medium">
                  Uploading video... ({Math.floor(progress)}%)
                </p>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-gray-500 mt-1">
                Please don't close this window while uploading
              </p>
            </div>
          </div>
        )
        
      case 'preparing':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm font-medium">Preparing upload...</p>
            </div>
          </div>
        )
        
      case 'processing':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2 w-full max-w-md">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm font-medium">
                  Processing video...
                </p>
              </div>
              <Progress value={100} className="w-full" />
              <p className="text-xs text-gray-500 mt-1">
                This may take a few minutes
              </p>
            </div>
          </div>
        )
        
      case 'success':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <svg 
                className="h-12 w-12 text-green-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
              <p className="text-lg font-medium">Upload Successful!</p>
              <p className="text-sm text-gray-500">
                Your video has been uploaded and is now processing
              </p>
            </div>
            <Button
              onClick={() => {
                setStatus('idle')
                setFile(null)
                setProgress(0)
              }}
            >
              Upload Another Video
            </Button>
          </div>
        )
        
      case 'error':
        return (
          <div className="flex flex-col items-center gap-4">
            <Alert variant="destructive" className="max-w-md">
              <AlertDescription>
                {typeof errorMessage === 'object' 
                  ? JSON.stringify(errorMessage) 
                  : String(errorMessage || 'Unknown error')}
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => {
                setStatus('idle')
                setErrorMessage('')
              }}
            >
              Try Again
            </Button>
          </div>
        )
        
      default:
        return activeTab === 'webcam' ? (
          <div className="flex flex-col items-center gap-4">
            {permissionGranted ? (
              <>
                <div className="w-full max-w-md aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button 
                  onClick={startRecording}
                  className="flex items-center gap-2"
                >
                  <Camera size={18} />
                  Start Recording
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4">
                {errorMessage && (
                  <Alert variant="destructive" className="max-w-md mb-4">
                    <AlertDescription>
                      {typeof errorMessage === 'object' 
                        ? JSON.stringify(errorMessage) 
                        : String(errorMessage || 'Unknown error')}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="w-full max-w-md aspect-video bg-gray-100 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6">
                  <Camera size={48} className="text-gray-400 mb-2" />
                  <p className="text-sm font-medium">Camera access required</p>
                  <p className="text-xs text-gray-500 mt-1">Click below to enable your camera and microphone</p>
                </div>
                <Button 
                  onClick={setupWebcam}
                  className="flex items-center gap-2"
                >
                  <Camera size={18} />
                  Enable Camera
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {file ? (
              <div className="flex flex-col items-center gap-4 w-full max-w-md">
                <div className="w-full p-4 border-2 border-dashed rounded-lg bg-gray-50">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setFile(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={uploadToCloudinary}
                    className="flex items-center gap-2"
                  >
                    <UploadCloud size={18} />
                    Upload Video
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                {errorMessage && (
                  <Alert variant="destructive" className="max-w-md mb-4">
                    <AlertDescription>
                      {typeof errorMessage === 'object' 
                        ? JSON.stringify(errorMessage) 
                        : String(errorMessage || 'Unknown error')}
                    </AlertDescription>
                  </Alert>
                )}
                <div 
                  ref={dropAreaRef}
                  className={`w-full max-w-md aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 cursor-pointer ${
                    isDragging ? 'border-blue-400 bg-blue-50' : 'hover:bg-gray-50'
                  } transition-colors`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <UploadCloud size={48} className={`${isDragging ? 'text-blue-400' : 'text-gray-400'} mb-2`} />
                  <p className="text-sm font-medium">
                    {isDragging ? 'Drop to upload' : 'Click to select a video'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Or drag and drop a file here</p>
                  <p className="text-xs text-gray-500 mt-3">MP4, WebM, MOV or MKV up to 100MB</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                  className="hidden"
                />
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <div className={`w-full max-w-lg mx-auto p-4 bg-white rounded-lg shadow-sm border ${className}`}>
      <h2 className="text-xl font-bold mb-4 text-center">Upload Video</h2>
      
      {['preparing', 'uploading', 'processing', 'success', 'error'].includes(status) ? (
        renderContent()
      ) : (
        <>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="webcam" className="flex items-center gap-2">
                <Camera size={16} />
                Record Video
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <UploadCloud size={16} />
                Upload File
              </TabsTrigger>
            </TabsList>
            <TabsContent value="webcam" className="mt-4">
              {renderContent()}
            </TabsContent>
            <TabsContent value="upload" className="mt-4">
              {renderContent()}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

export default CloudinaryVideoUploader 