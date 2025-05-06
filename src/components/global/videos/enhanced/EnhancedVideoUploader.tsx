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

interface EnhancedVideoUploaderProps {
  userId?: string // Made optional
  workspaceId: string
  folderId?: string
  clerkId?: string // Add clerkId for more reliable identification
  maxRetries?: number // Configurable retry count
  chunkSize?: number // Configurable chunk size
  socketUrl?: string // Configurable socket server URL
}

type UploadStatus = 'idle' | 'recording' | 'uploading' | 'processing' | 'retry' | 'error' | 'success'

/**
 * Enhanced Video Uploader with improved resilience and error handling
 * Features:
 * - Adaptive chunk sizing based on network conditions
 * - Automatic retry for failed uploads
 * - Better error handling and user feedback
 * - Improved socket connection management
 * - Drag and drop support
 */
const EnhancedVideoUploader: React.FC<EnhancedVideoUploaderProps> = ({ 
  userId, 
  workspaceId, 
  folderId,
  clerkId,
  maxRetries = 3,
  chunkSize: initialChunkSize = 1024 * 1024, // Default 1MB chunks
  socketUrl: customSocketUrl
}) => {
  // Generate anonymous user ID if none provided
  const [effectiveUserId] = useState<string>(userId || `anonymous_${uuidv4()}`)
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const socketRef = useRef<Socket | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropAreaRef = useRef<HTMLDivElement>(null)
  const uploadTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const uploadAttemptRef = useRef(0)
  const currentChunkRef = useRef(0)
  const totalChunksRef = useRef(0)
  
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
  const [adaptiveChunkSize, setAdaptiveChunkSize] = useState(initialChunkSize)
  const [networkQuality, setNetworkQuality] = useState<'good'|'medium'|'poor'>('medium')
  const [isDragging, setIsDragging] = useState(false)
  const [activeFilename, setActiveFilename] = useState<string | null>(null)
  
  const { toast } = useToast()
  const router = useRouter()

  // Connection management - detect if user is about to leave
  useEffect(() => {
    // Prevent accidental navigation during active uploads
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === 'uploading' || status === 'processing' || status === 'recording') {
        const message = 'You have an active upload in progress. Are you sure you want to leave?';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [status]);

  // Initialize socket connection
  useEffect(() => {
    // Determine socket URL with fallbacks
    const socketUrl = customSocketUrl || 
                     process.env.NEXT_PUBLIC_EXPRESS_SERVER_URL || 
                     process.env.NEXT_PUBLIC_SOCKET_URL || 
                     'http://localhost:5000';
    
    // Connection options
    const socketOptions = {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 60000
    };
    
    // Create socket connection
    const socket = io(socketUrl, socketOptions);
    socketRef.current = socket;
    
    // Socket event listeners
    socket.on('connected', () => {
      console.log('Connected to socket server');
      
      // Check network quality
      measureNetworkQuality();
      
      // Identify user to the server (using effectiveUserId instead of userId)
      socket.emit('identify-user', {
        userId: effectiveUserId,
        clerkId,
        workspaceId
      });
    });
    
    // Handle reconnection
    socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected to server after ${attemptNumber} attempts`);
      
      // If we were in the middle of an upload, resume where we left off
      if (activeFilename && (status === 'uploading' || status === 'retry')) {
        resumeUpload(activeFilename);
      }
    });
    
    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      
      if (status === 'uploading' || status === 'processing') {
        setStatus('retry');
        setErrorMessage(`Connection error: ${error.message}. Attempting to reconnect...`);
        toast({
          variant: 'destructive',
          title: 'Connection Error',
          description: 'Lost connection to server. Trying to reconnect...'
        });
      }
    });
    
    // Handle chunk acknowledgment
    socket.on('chunk-received', (data) => {
      // Reset timeout on successful chunk receipt
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
        uploadTimeoutRef.current = null;
      }
    });
    
    // Handle video processing status
    socket.on('video-processing', (data) => {
      console.log('Video processing update:', data);
      setStatus('processing');
      
      // Update progress information (if available)
      if (data.progress) {
        setProgress(data.progress);
      }
    });
    
    // Handle upload errors
    socket.on('upload-error', (data) => {
      console.error('Upload error:', data);
      
      // Check if we should retry
      if (uploadAttemptRef.current < maxRetries) {
        setStatus('retry');
        uploadAttemptRef.current++;
        
        // Reduce chunk size on error for better reliability
        const newChunkSize = Math.floor(adaptiveChunkSize * 0.75);
        setAdaptiveChunkSize(newChunkSize);
        
        // Try again after a delay
        setTimeout(() => {
          if (activeFilename) {
            resumeUpload(activeFilename);
          } else if (selectedFile) {
            uploadFile();
          }
        }, 2000);
        
        toast({
          title: 'Upload Issue',
          description: `Retrying upload (Attempt ${uploadAttemptRef.current}/${maxRetries})`,
          variant: 'default'
        });
      } else {
        setStatus('error');
        setErrorMessage(data.message || 'Error uploading video. Maximum retry attempts reached.');
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: data.message || 'Failed to upload video after multiple attempts.'
        });
      }
    });
    
    // Handle upload completion
    socket.on('upload-complete', (data) => {
      console.log('Upload complete:', data);
      setStatus('success');
      setProgress(100);
      
      toast({
        title: 'Upload Complete',
        description: 'Your video has been successfully uploaded and processed.',
        variant: 'default'
      });
      
      // Redirect after success (with slight delay for user to see success state)
      setTimeout(() => {
        router.refresh();
        // Optionally redirect to the new video
        if (data.videoId) {
          router.push(`/preview/${data.videoId}`);
        }
      }, 2000);
    });
    
    // Cleanup on unmount
    return () => {
      cleanupResources();
      if (socket) {
        socket.disconnect();
      }
    };
  }, [effectiveUserId, workspaceId, clerkId, toast, router, maxRetries, customSocketUrl]);

  // Setup drag and drop
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };
    
    const handleDragLeave = () => {
      setIsDragging(false);
    };
    
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      if (activeTab === 'upload' && e.dataTransfer?.files.length) {
        handleFileSelection(e.dataTransfer.files[0]);
      }
    };
    
    const dropArea = dropAreaRef.current;
    if (dropArea) {
      dropArea.addEventListener('dragover', handleDragOver);
      dropArea.addEventListener('dragleave', handleDragLeave);
      dropArea.addEventListener('drop', handleDrop);
    }
    
    return () => {
      if (dropArea) {
        dropArea.removeEventListener('dragover', handleDragOver);
        dropArea.removeEventListener('dragleave', handleDragLeave);
        dropArea.removeEventListener('drop', handleDrop);
      }
    };
  }, [activeTab]);

  // Test network quality
  const measureNetworkQuality = async () => {
    try {
      const startTime = Date.now();
      const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace', { cache: 'no-store' });
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      // Adjust chunk size based on network quality
      if (latency < 100) {
        setNetworkQuality('good');
        setAdaptiveChunkSize(initialChunkSize * 2); // 2MB chunks for good connections
      } else if (latency < 300) {
        setNetworkQuality('medium');
        setAdaptiveChunkSize(initialChunkSize); // 1MB for medium connections
      } else {
        setNetworkQuality('poor');
        setAdaptiveChunkSize(initialChunkSize / 2); // 512KB for poor connections
      }
      
      console.log(`Network latency: ${latency}ms, quality: ${networkQuality}, chunk size: ${adaptiveChunkSize / 1024}KB`);
    } catch (error) {
      console.warn('Could not measure network quality:', error);
      // Default to medium quality
      setNetworkQuality('medium');
    }
  };

  // Clean up all resources
  const cleanupResources = () => {
    stopRecording();
    
    // Clear timeouts
    if (uploadTimeoutRef.current) {
      clearTimeout(uploadTimeoutRef.current);
      uploadTimeoutRef.current = null;
    }
    
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingIntervalState(null);
    }
    
    // Release camera/mic
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    // Clean uploads
    chunksRef.current = [];
    currentChunkRef.current = 0;
    totalChunksRef.current = 0;
    uploadAttemptRef.current = 0;
    setActiveFilename(null);
  };

  // Setup webcam
  const setupWebcam = async () => {
    try {
      setErrorMessage('');
      const constraints = {
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      // First check if we have permissions
      const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      if (permissionStatus.state === 'denied') {
        throw new Error('Camera access has been denied. Please update your browser settings.');
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setPermissionGranted(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Error accessing media devices:', err);
      setErrorMessage(`Camera access error: ${err.message || 'Could not access webcam'}`);
      setPermissionGranted(false);
      
      toast({
        variant: 'destructive',
        title: 'Camera Access Error',
        description: 'Please allow camera and microphone access to record video.',
      });
    }
  };
  
  // Start recording
  const startRecording = () => {
    if (!stream) return;
    
    try {
      // Check browser storage quota before recording
      if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(({ usage, quota }) => {
          if (quota && usage && (quota - usage < 200 * 1024 * 1024)) {
            toast({
              title: 'Storage Warning',
              description: 'You have limited storage space. Long recordings may fail.',
              variant: 'default'
            });
          }
        });
      }
      
      // Clear previous recording chunks
      chunksRef.current = [];
      
      // Use codecs that are widely supported
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      // Generate a filename now and store it
      const filename = `recording_${uuidv4()}_${effectiveUserId}.webm`;
      setActiveFilename(filename);
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          
          // Send chunks to server in real-time (this is more reliable for large recordings)
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('video-chunks', {
              chunks: e.data,
              filename: filename,
              userId: effectiveUserId,
              clerkId,
              workspaceId
            });
          }
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('Recording stopped, sending final data');
        
        // Final processing request to server
        if (socketRef.current && activeFilename) {
          socketRef.current.emit('process-video', {
            filename: activeFilename,
            userId: effectiveUserId,
            clerkId,
            workspaceId
          });
        }
      };
      
      // Start recording with chunk interval based on network quality
      const chunkInterval = networkQuality === 'good' ? 2000 : 
                          networkQuality === 'medium' ? 1000 : 500;
      
      mediaRecorder.start(chunkInterval);
      mediaRecorderRef.current = mediaRecorder;
      setStatus('recording');
      
      // Setup recording timer
      const interval = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
      setRecordingIntervalState(interval);
      
      // Notify server about keeping connection alive for a recording session
      if (socketRef.current) {
        socketRef.current.emit('keep-connection', {
          filename: activeFilename,
          isActiveRecording: true
        });
      }
      
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setErrorMessage(`Recording error: ${err.message || 'Could not start recording'}`);
      toast({
        variant: 'destructive',
        title: 'Recording Error',
        description: err.message || 'Failed to start recording'
      });
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      try {
        mediaRecorderRef.current.stop();
        setStatus('uploading');
        
        // Clear timer
        if (recordingInterval) {
          clearInterval(recordingInterval);
          setRecordingIntervalState(null);
        }
        setRecordingTime(0);
        
        // Show toast notification
        toast({
          title: 'Processing Video',
          description: 'Your video is being processed. This may take a moment.'
        });
        
        // Release camera/mic resources
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
        
        // Switch to processing status
        setStatus('processing');
      } catch (err: any) {
        console.error('Error stopping recording:', err);
        setErrorMessage(`Error finalizing recording: ${err.message}`);
        setStatus('error');
      }
    }
  };
  
  // Handle file selection
  const handleFileSelection = (file: File) => {
    // Validate file type
    const validTypes = ['video/webm', 'video/mp4', 'video/quicktime', 'video/x-matroska'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Invalid file type. Please upload WebM, MP4, MOV, or MKV files.');
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a supported video format.'
      });
      return;
    }
    
    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
      setErrorMessage('File is too large. Maximum size is 100MB.');
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Maximum file size is 100MB.'
      });
      return;
    }
    
    setSelectedFile(file);
    setErrorMessage('');
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };
  
  // Resume upload from last successful chunk
  const resumeUpload = (filename: string) => {
    if (!selectedFile || !socketRef.current) return;
    
    setStatus('uploading');
    setErrorMessage('');
    
    // Continue from last successful chunk
    uploadFile(currentChunkRef.current);
  };
  
  // Upload file
  const uploadFile = async (startChunk: number = 0) => {
    if (!selectedFile || !socketRef.current) return;
    
    try {
      setStatus('uploading');
      setProgress(0);
      
      // Create unique filename if not already set
      if (!activeFilename) {
        const extension = selectedFile.name.split('.').pop() || 'mp4';
        const filename = `upload_${uuidv4()}_${effectiveUserId}.${extension}`;
        setActiveFilename(filename);
      }
      
      // Calculate chunking parameters
      const totalChunks = Math.ceil(selectedFile.size / adaptiveChunkSize);
      totalChunksRef.current = totalChunks;
      currentChunkRef.current = startChunk;
      
      // Notify server to keep connection alive
      socketRef.current.emit('keep-connection', {
        filename: activeFilename,
        isActiveRecording: false
      });
      
      // Start/resume the chunking process
      uploadNextChunk();
      
    } catch (err: any) {
      console.error('Error initiating upload:', err);
      setStatus('error');
      setErrorMessage(`Upload error: ${err.message || 'Could not upload file'}`);
    }
  };
  
  // Upload chunks sequentially with retries
  const uploadNextChunk = async () => {
    if (!selectedFile || !socketRef.current || !activeFilename) return;
    
    try {
      const start = currentChunkRef.current * adaptiveChunkSize;
      const end = Math.min(start + adaptiveChunkSize, selectedFile.size);
      const chunk = selectedFile.slice(start, end);
      
      // Set timeout for chunk upload (safety net)
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
      }
      
      uploadTimeoutRef.current = setTimeout(() => {
        console.warn(`Chunk ${currentChunkRef.current} upload timed out, retrying...`);
        uploadNextChunk(); // Try the same chunk again
      }, 30000); // 30 second timeout
      
      // Send chunk to server
      socketRef.current.emit('video-chunks', {
        chunks: chunk,
        filename: activeFilename,
        userId: effectiveUserId,
        clerkId,
        workspaceId,
        chunkIndex: currentChunkRef.current,
        totalChunks: totalChunksRef.current
      });
      
      // Update progress
      const newProgress = Math.floor(((currentChunkRef.current + 1) / totalChunksRef.current) * 100);
      setProgress(newProgress);
      
      // Move to next chunk
      currentChunkRef.current++;
      
      // Continue with next chunk or finish
      if (currentChunkRef.current < totalChunksRef.current) {
        // Throttle uploads slightly to avoid overwhelming the server
        // But adapt based on network quality
        const delay = networkQuality === 'good' ? 10 : 
                     networkQuality === 'medium' ? 50 : 100;
        
        setTimeout(uploadNextChunk, delay);
      } else {
        // All chunks uploaded, tell server to process the video
        console.log('All chunks uploaded, processing video');
        
        // Clear timeout since we're done uploading chunks
        if (uploadTimeoutRef.current) {
          clearTimeout(uploadTimeoutRef.current);
          uploadTimeoutRef.current = null;
        }
        
        socketRef.current.emit('process-video', {
          filename: activeFilename,
          userId: effectiveUserId,
          clerkId,
          workspaceId
        });
        
        setStatus('processing');
        
        // Show toast notification
        toast({
          title: 'Processing Video',
          description: 'Your video has been uploaded and is now being processed.'
        });
      }
      
    } catch (err: any) {
      console.error(`Error uploading chunk ${currentChunkRef.current}:`, err);
      
      // Retry current chunk
      if (uploadAttemptRef.current < maxRetries) {
        uploadAttemptRef.current++;
        console.log(`Retrying chunk ${currentChunkRef.current}, attempt ${uploadAttemptRef.current}`);
        
        // Wait before retrying
        setTimeout(uploadNextChunk, 1000);
      } else {
        setStatus('error');
        setErrorMessage(`Failed to upload chunk ${currentChunkRef.current} after ${maxRetries} attempts`);
      }
    }
  };
  
  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Reset uploader state
  const resetUploader = () => {
    cleanupResources();
    setStatus('idle');
    setProgress(0);
    setErrorMessage('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
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
        );
        
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
              <div className="flex justify-between w-full text-xs text-gray-500 mt-1">
                <span>Chunk {currentChunkRef.current}/{totalChunksRef.current}</span>
                <span>Network: {networkQuality}</span>
              </div>
            </div>
          </div>
        );
        
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
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-gray-500 mt-1">
                This may take a few minutes
              </p>
            </div>
          </div>
        );
        
      case 'retry':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2 w-full max-w-md">
              <Alert variant="default" className="bg-amber-50 border-amber-200">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                  <AlertDescription className="text-amber-800">
                    Reconnecting... Attempt {uploadAttemptRef.current}/{maxRetries}
                  </AlertDescription>
                </div>
              </Alert>
              <p className="text-xs text-gray-500 mt-4">
                Please wait while we try to resume your upload
              </p>
            </div>
          </div>
        );
        
      case 'error':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-3 w-full max-w-md">
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
              <div className="flex items-center gap-2 mt-2">
                <Button variant="outline" onClick={resetUploader}>
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        );
        
      case 'success':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2 w-full max-w-md">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle size={24} />
                <p className="text-lg font-medium">Upload Complete</p>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Your video has been successfully uploaded and processed.
              </p>
              <Button 
                className="mt-4"
                onClick={() => router.push(`/dashboard/${workspaceId}`)}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        );
      
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
                    onClick={() => uploadFile()}
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
                  ref={dropAreaRef}
                  className={`w-full max-w-md aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 cursor-pointer ${
                    isDragging ? 'border-blue-400 bg-blue-50' : 'hover:bg-gray-50'
                  } transition-colors`}
                  onClick={() => fileInputRef.current?.click()}
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
        );
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    if (status !== 'idle') return;
    setActiveTab(value);
    
    // Reset state when switching tabs
    setErrorMessage('');
    setSelectedFile(null);
    
    // Setup webcam if selected
    if (value === 'webcam' && !permissionGranted) {
      setupWebcam();
    }
    
    // Stop webcam stream if switching to upload
    if (value === 'upload' && stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 bg-white rounded-lg shadow-sm border">
      <h2 className="text-xl font-bold mb-4 text-center">Upload Video</h2>
      
      {['recording', 'uploading', 'processing', 'retry', 'error', 'success'].includes(status) ? (
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
  );
};

export default EnhancedVideoUploader; 