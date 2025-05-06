'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { UploadCloud, Camera, StopCircle, Loader2, XCircle, CheckCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { io, Socket } from 'socket.io-client'
import { v4 as uuidv4 } from 'uuid'
import { useRouter } from 'next/navigation'

interface VideoUploaderProps {
  userId: string
  workspaceId: string
  folderId?: string
}

type UploadStatus = 'idle' | 'recording' | 'uploading' | 'processing' | 'error' | 'success'

const VideoUploader: React.FC<VideoUploaderProps> = ({ userId, workspaceId, folderId }) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const socketRef = useRef<Socket | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingInterval, setRecordingIntervalState] = useState<NodeJS.Timeout | null>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [activeTab, setActiveTab] = useState('webcam')
  
  const { toast } = useToast()
  const router = useRouter()

  // Initialize socket connection
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000'
    socketRef.current = io(socketUrl)
    
    // Socket event listeners
    socketRef.current.on('connected', () => {
      console.log('Connected to socket server')
    })
    
    socketRef.current.on('upload-error', (data) => {
      setStatus('error')
      setErrorMessage(data.message || 'Error uploading video')
      toast({
        variant: 'destructive',
        title: 'Upload Error',
        description: data.message || 'There was an error uploading your video.'
      })
    })
    
    // Cleanup on unmount
    return () => {
      stopRecording()
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [toast])

  // Setup webcam
  const setupWebcam = async () => {
    try {
      setErrorMessage('')
      const constraints = {
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      setPermissionGranted(true)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err: any) {
      console.error('Error accessing media devices:', err)
      setErrorMessage(`Camera access error: ${err.message || 'Could not access webcam'}`)
      setPermissionGranted(false)
    }
  }
  
  // Start recording
  const startRecording = () => {
    if (!stream) return
    
    chunksRef.current = []
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' })
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data)
        
        // Send chunks to server while recording
        if (socketRef.current) {
          const filename = `${uuidv4()}-${userId}.webm`
          socketRef.current.emit('video-chunks', {
            chunks: e.data,
            filename: filename
          })
        }
      }
    }
    
    mediaRecorder.onstop = () => {
      console.log('Recording stopped')
    }
    
    // Start recording
    mediaRecorder.start(1000) // Collect chunks every second
    mediaRecorderRef.current = mediaRecorder
    setStatus('recording')
    
    // Setup recording timer
    const interval = setInterval(() => {
      setRecordingTime((prevTime) => prevTime + 1)
    }, 1000)
    setRecordingIntervalState(interval)
  }
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop()
      setStatus('uploading')
      
      // Process video once recording is finished
      const filename = `${uuidv4()}-${userId}.webm`
      if (socketRef.current) {
        socketRef.current.emit('process-video', {
          filename,
          userId
        })
        setStatus('processing')
      }
      
      // Clear timer
      if (recordingInterval) {
        clearInterval(recordingInterval)
        setRecordingIntervalState(null)
      }
      setRecordingTime(0)
      
      // Show toast notification
      toast({
        title: 'Processing Video',
        description: 'Your video is being processed. This may take a moment.'
      })
      
      // Stop tracks
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        setStream(null)
      }
      
      // Simulate progress and completion
      simulateProgress()
    }
  }
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      
      // Validate file type
      const validTypes = ['video/webm', 'video/mp4', 'video/quicktime']
      if (!validTypes.includes(file.type)) {
        setErrorMessage('Invalid file type. Please upload WebM, MP4, or MOV files.')
        return
      }
      
      // Validate file size (100MB limit)
      const maxSize = 100 * 1024 * 1024 // 100MB in bytes
      if (file.size > maxSize) {
        setErrorMessage('File is too large. Maximum size is 100MB.')
        return
      }
      
      setSelectedFile(file)
      setErrorMessage('')
    }
  }
  
  // Upload file
  const uploadFile = async () => {
    if (!selectedFile || !socketRef.current) return
    
    try {
      setStatus('uploading')
      setProgress(0)
      
      // Create unique filename
      const filename = `${uuidv4()}-${userId}.${selectedFile.name.split('.').pop()}`
      
      // Read file as chunks and send to server
      const chunkSize = 1024 * 1024 // 1MB chunks
      const totalChunks = Math.ceil(selectedFile.size / chunkSize)
      let currentChunk = 0
      
      const readAndUploadChunk = async () => {
        const start = currentChunk * chunkSize
        const end = Math.min(start + chunkSize, selectedFile.size)
        const chunk = selectedFile.slice(start, end)
        
        socketRef.current?.emit('video-chunks', {
          chunks: chunk,
          filename
        })
        
        currentChunk++
        
        // Update progress
        const newProgress = Math.floor((currentChunk / totalChunks) * 100)
        setProgress(newProgress)
        
        // Continue with next chunk or finish
        if (currentChunk < totalChunks) {
          setTimeout(readAndUploadChunk, 100) // Throttle uploads slightly
        } else {
          // All chunks uploaded, process the video
          socketRef.current?.emit('process-video', {
            filename,
            userId
          })
          setStatus('processing')
          
          // Show toast notification
          toast({
            title: 'Processing Video',
            description: 'Your video is being processed. This may take a moment.'
          })
          
          // Simulate processing progress
          simulateProgress()
        }
      }
      
      // Start chunking and uploading
      readAndUploadChunk()
      
    } catch (err: any) {
      console.error('Error uploading file:', err)
      setStatus('error')
      setErrorMessage(`Upload error: ${err.message || 'Could not upload file'}`)
    }
  }
  
  // Simulate progress for better UX during processing
  const simulateProgress = () => {
    setProgress(0)
    
    // Simulate gradual progress increase
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.floor(Math.random() * 5)
        
        if (newProgress >= 100) {
          clearInterval(interval)
          setStatus('success')
          setProgress(100)
          
          // Show success notification
          toast({
            title: 'Upload Complete',
            description: 'Your video has been successfully uploaded and processed.',
            variant: 'default'
          })
          
          // Redirect after a delay
          setTimeout(() => {
            router.refresh()
          }, 1500)
          
          return 100
        }
        
        return newProgress
      })
    }, 800)
  }
  
  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // Reset uploader state
  const resetUploader = () => {
    setStatus('idle')
    setProgress(0)
    setErrorMessage('')
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  // Render based on upload status
  const renderContent = () => {
    switch (status) {
      case 'recording':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-full max-w-md aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full">
                <span className="animate-pulse h-2 w-2 rounded-full bg-red-500"></span>
                <span className="text-white text-sm font-medium">{formatTime(recordingTime)}</span>
              </div>
            </div>
            <Button 
              variant="destructive" 
              size="lg" 
              onClick={stopRecording}
              className="flex items-center gap-2"
            >
              <StopCircle size={18} />
              Stop Recording
            </Button>
          </div>
        )
        
      case 'uploading':
      case 'processing':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2 w-full max-w-md">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm font-medium">
                  {status === 'uploading' ? 'Uploading video...' : 'Processing video...'}
                </p>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-gray-500 mt-1">{progress}% complete</p>
            </div>
          </div>
        )
        
      case 'error':
        return (
          <div className="flex flex-col items-center gap-4">
            <Alert variant="destructive" className="max-w-md">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
            <Button onClick={resetUploader}>Try Again</Button>
          </div>
        )
        
      case 'success':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle className="h-8 w-8" />
              <p className="text-lg font-medium">Upload Complete!</p>
            </div>
            <p className="text-sm text-gray-500">Your video has been successfully uploaded and processed.</p>
            <Button onClick={resetUploader}>Upload Another Video</Button>
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
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
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
            {selectedFile ? (
              <div className="flex flex-col items-center gap-4 w-full max-w-md">
                <div className="w-full p-4 border-2 border-dashed rounded-lg bg-gray-50">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedFile(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={uploadFile}
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
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
                <div 
                  className="w-full max-w-md aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud size={48} className="text-gray-400 mb-2" />
                  <p className="text-sm font-medium">Click to select a video</p>
                  <p className="text-xs text-gray-500 mt-1">Or drag and drop a file here</p>
                  <p className="text-xs text-gray-500 mt-3">MP4, WebM or MOV up to 100MB</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                />
              </div>
            )}
          </div>
        )
    }
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    if (status !== 'idle') return
    setActiveTab(value)
    
    // Reset state when switching tabs
    setErrorMessage('')
    setSelectedFile(null)
    
    // Setup webcam if selected
    if (value === 'webcam' && !permissionGranted) {
      setupWebcam()
    }
    
    // Stop webcam stream if switching to upload
    if (value === 'upload' && stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto p-4 bg-white rounded-lg shadow-sm border">
      <h2 className="text-xl font-bold mb-4 text-center">Upload Video</h2>
      
      {['recording', 'uploading', 'processing', 'error', 'success'].includes(status) ? (
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

export default VideoUploader 