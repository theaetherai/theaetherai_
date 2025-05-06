'use client'

import { useEffect, useState } from 'react'
import { useSocket } from '@/components/global/socket-provider'

interface TutorConnectionOptions {
  autoConnect?: boolean
  onMessage?: (message: any) => void
  onError?: (error: Error) => void
  userId?: string
  videoId?: string
}

/**
 * Hook to manage connections to the AI tutor socket
 */
export const useTutorConnection = (options: TutorConnectionOptions = {}) => {
  const { socket, isConnected } = useSocket()
  const [tutorState, setTutorState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [tutorError, setTutorError] = useState<Error | null>(null)
  const [tutorResponse, setTutorResponse] = useState<any>(null)
  
  // Connect to tutor when socket is ready
  useEffect(() => {
    if (!options.autoConnect) return
    
    if (socket && isConnected) {
      connectToTutor()
    }
  }, [socket, isConnected, options.autoConnect])
  
  // Set up event listeners
  useEffect(() => {
    if (!socket) return
    
    const handleTutorResponse = (data: any) => {
      setTutorResponse(data)
      setTutorState('connected')
      
      if (options.onMessage) {
        options.onMessage(data)
      }
    }
    
    const handleTutorError = (error: any) => {
      setTutorError(new Error(error.message || 'Error connecting to tutor'))
      setTutorState('error')
      
      if (options.onError) {
        options.onError(new Error(error.message || 'Error connecting to tutor'))
      }
    }
    
    // Register listeners
    socket.on('tutor-response', handleTutorResponse)
    socket.on('tutor-error', handleTutorError)
    
    return () => {
      // Clean up listeners
      socket.off('tutor-response', handleTutorResponse)
      socket.off('tutor-error', handleTutorError)
    }
  }, [socket, options.onMessage, options.onError])
  
  // Connect to tutor
  const connectToTutor = () => {
    if (!socket || !isConnected) {
      setTutorError(new Error('Socket not connected'))
      setTutorState('error')
      return
    }
    
    setTutorState('connecting')
    
    socket.emit('connect-tutor', {
      userId: options.userId,
      videoId: options.videoId
    })
  }
  
  // Send message to tutor
  const sendQuestion = (question: string) => {
    if (!socket || !isConnected) {
      setTutorError(new Error('Socket not connected'))
      setTutorState('error')
      return
    }
    
    socket.emit('tutor-question', {
      question,
      userId: options.userId,
      videoId: options.videoId
    })
  }
  
  return {
    tutorState,
    tutorError,
    tutorResponse,
    connectToTutor,
    sendQuestion,
    isConnected
  }
}

export default useTutorConnection 