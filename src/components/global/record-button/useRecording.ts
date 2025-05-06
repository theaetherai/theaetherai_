'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';
import { RecordOptions } from './RecordModal';
import { io, Socket } from 'socket.io-client';

// Get server URL from environment variable or use default
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_EXPRESS_SERVER_URL || 'http://localhost:5000';

interface UseRecordingProps {
  userId: string;
  workspaceId: string;
  clerkId?: string; // Add this property for Clerk user ID
}

interface UseRecordingReturn {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  startRecording: (options: RecordOptions) => Promise<void>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  recordingError: string | null;
  isProcessing: boolean;
}

export const useRecording = ({ userId, workspaceId, clerkId }: UseRecordingProps): UseRecordingReturn => {
  // All state hooks must be at the top level of the component
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
  
  const { toast } = useToast();
  
  // All ref hooks must be at the top level
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fileNameRef = useRef<string>('');
  const processingCompleteRef = useRef<boolean>(false);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const failsafeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finalTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const missedHeartbeatsRef = useRef<number>(0);

  // Critical flag to prevent premature socket disconnection
  const needsProcessingRef = useRef<boolean>(false);
  
  // Define cleanup function with useCallback to use in effects
  const cleanupRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    mediaRecorderRef.current = null;
    startTimeRef.current = 0;
    pausedTimeRef.current = 0;
    setDuration(0);
  }, []);
  
  // Add this function to handle notifying the server of cleanup completion
  const notifyCleanupComplete = useCallback(async () => {
    if (fileNameRef.current) {
      try {
        // First try API method
        console.log(`Notifying cleanup completion for ${fileNameRef.current}`);
        const recordingId = fileNameRef.current.split('.')[0].split('-').pop(); // Extract UUID from filename
        
        if (recordingId) {
          console.log(`Extracted recording ID: ${recordingId}`);
          
          // Try using a more basic approach to avoid routing issues
          const apiUrl = window.location.origin + `/api/recording/${recordingId}/cleanup-complete`;
          console.log(`Calling API with full URL: ${apiUrl}`);
          
          try {
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                userId,
                clerkId,
                workspaceId,
                filename: fileNameRef.current
              })
            });
            
            const responseData = await response.text();
            console.log(`API Response (${response.status}):`, responseData);
            
            if (response.ok) {
              console.log('Successfully notified server of cleanup completion via API');
            } else {
              console.warn(`Failed to notify cleanup via API (${response.status}), trying alternative endpoint`);
              
              // Try alternative endpoint
              try {
                console.log('Trying alternative cleanup endpoint');
                const altResponse = await fetch(window.location.origin + '/api/cleanup-recording', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    recordingId,
                    userId,
                    clerkId,
                    workspaceId,
                    filename: fileNameRef.current
                  })
                });
                
                if (altResponse.ok) {
                  console.log('Successfully used alternative cleanup endpoint');
                  return; // Success with alternative endpoint
                } else {
                  console.warn('Alternative endpoint also failed, falling back to socket');
                }
              } catch (altError) {
                console.error('Error with alternative endpoint:', altError);
              }
              
              // Fall back to socket as last resort
              if (socketRef.current && socketRef.current.connected) {
                console.log('Using socket fallback for cleanup notification');
                socketRef.current.emit('cleanup-complete', {
                  filename: fileNameRef.current,
                  userId,
                  clerkId,
                  workspaceId
                });
              } else {
                console.warn('Socket not available for fallback');
              }
            }
          } catch (fetchError) {
            console.error('Fetch error during cleanup notification:', fetchError);
            
            // Try alternative endpoint first
            try {
              console.log('Trying alternative cleanup endpoint after fetch error');
              const altResponse = await fetch(window.location.origin + '/api/cleanup-recording', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  recordingId,
                  userId,
                  clerkId,
                  workspaceId,
                  filename: fileNameRef.current
                })
              });
              
              if (altResponse.ok) {
                console.log('Successfully used alternative cleanup endpoint');
                return; // Success with alternative endpoint
              }
            } catch (altError) {
              console.error('Error with alternative endpoint:', altError);
            }
            
            // Fall back to socket
            if (socketRef.current && socketRef.current.connected) {
              console.log('Using socket fallback for cleanup notification after fetch error');
              socketRef.current.emit('cleanup-complete', {
                filename: fileNameRef.current,
                userId,
                clerkId,
                workspaceId
              });
            }
          }
        } else {
          console.warn('Could not extract recording ID from filename');
        }
      } catch (error) {
        console.error('Error notifying cleanup completion:', error);
        toast({
          title: "Warning",
          description: "Could not notify server of cleanup completion. This is not critical but you may want to refresh the page.",
          variant: "warning"
        });
      } finally {
        // Always reset processing flags to prevent UI being stuck
        setIsProcessing(false);
        needsProcessingRef.current = false;
      }
    } else {
      console.log('No filename available for cleanup notification');
    }
  }, [userId, clerkId, workspaceId, toast]);

  // Full cleanup including socket - wrapped in useCallback
  const fullCleanup = useCallback(() => {
    cleanupRecording();
    
    // Reset processing flags
    needsProcessingRef.current = false;
    processingCompleteRef.current = false;
    
    // Also clear chunks since we don't need them anymore
    chunksRef.current = [];
    
    // Clear all timeouts and intervals
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    
    if (failsafeTimeoutRef.current) {
      clearTimeout(failsafeTimeoutRef.current);
      failsafeTimeoutRef.current = null;
    }
    
    if (finalTimeoutRef.current) {
      clearTimeout(finalTimeoutRef.current);
      finalTimeoutRef.current = null;
    }
    
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }
    
    // Notify cleanup complete before disconnecting socket
    if (fileNameRef.current) {
      notifyCleanupComplete();
    }
    
    // Disconnect socket
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
  }, [cleanupRecording, notifyCleanupComplete]);

  // Socket connection setup - now inside useEffect to avoid conditional hook calls
  useEffect(() => {
    // Only create a socket connection when we need to record or process
    if (!isRecording && !isProcessing && !needsProcessingRef.current) {
      // Don't initialize socket if not needed
      return;
    }
    
    console.log("Setting up socket connection for recording/processing");
    
    // Setup function moved inside the effect
    const setupSocketConnection = () => {
      // Store previous socket ID if one exists
      const previousSocketId = socketRef.current?.id;
      
      // CRITICAL: Don't disconnect the existing socket if processing is needed
      if (socketRef.current && 'connected' in socketRef.current && socketRef.current.connected) {
        if (needsProcessingRef.current) {
          console.log('Socket connection preserved for processing - not disconnecting');
          return socketRef.current;
        }
        socketRef.current.disconnect();
      }

      // Connect to socket server with enhanced reliability settings
      const socket = io(SOCKET_SERVER_URL, {
        transports: ['websocket', 'polling'], // Enable fallback to polling
        reconnection: true,
        reconnectionAttempts: Infinity, // Never stop trying to reconnect
        reconnectionDelay: 1000, // Start with 1 second delay
        reconnectionDelayMax: 5000, // Max out at 5 seconds
        timeout: 60000, // Increase connection timeout to 60 seconds
        autoConnect: true, // Auto-connect immediately
        forceNew: false // Reuse connections when possible
      });

      // Reset missed heartbeats counter
      missedHeartbeatsRef.current = 0;
      const MAX_MISSED_HEARTBEATS = 3;

      // Override native socket.close to prevent accidental disconnections during processing
      const originalClose = socket.close;
      socket.close = function() {
        if (needsProcessingRef.current) {
          console.log('Prevented socket close during processing - critical operation in progress');
          return socket; // Prevent closing
        }
        // @ts-ignore - apply with arguments is safe here
        return originalClose.apply(this);
      };
      
      // Also override disconnect to prevent disconnection during active recording/processing
      const originalDisconnect = socket.disconnect;
      socket.disconnect = function() {
        if (needsProcessingRef.current) {
          console.log('Prevented socket disconnect during recording/processing - critical operation in progress');
          // If we're in the processing phase, emitting process-video event or actively recording,
          // we should prevent disconnection
          return socket; // Prevent disconnection
        }
        // @ts-ignore - apply with arguments is safe here
        return originalDisconnect.apply(this);
      };

      // Set up all socket event handlers
      setupSocketEventHandlers(socket);

      // Implement advanced heartbeat monitoring
      const heartbeatInterval = setInterval(() => {
        if (socket.connected && needsProcessingRef.current) {
          socket.emit('heartbeat', { 
            timestamp: Date.now(),
            filename: fileNameRef.current || null
          });
          
          // Increment missed heartbeats (will be reset when we get ack)
          missedHeartbeatsRef.current++;
          
          // If we've missed too many heartbeats, try to reconnect
          if (missedHeartbeatsRef.current >= MAX_MISSED_HEARTBEATS) {
            console.log('Too many missed heartbeats, forcing reconnection');
            socket.disconnect().connect();
            missedHeartbeatsRef.current = 0;
          }
        }
      }, 5000); // Every 5 seconds

      // Set up keepalive interval
      const keepAliveInterval = setInterval(() => {
        // Use different ping strategies depending on state
        if (socket && socket.connected) {
          const isProcessingActive = needsProcessingRef.current && !processingCompleteRef.current;
          const isRecordingActive = isRecording && !isPaused;
          
          // Base ping
          socket.emit('ping');
          
          // Extra keepalive measures for critical phases
          if (fileNameRef.current && (isProcessingActive || isRecordingActive)) {
            // More aggressive keep-connection for critical phases
            socket.emit('keep-connection', {
              filename: fileNameRef.current,
              needsProcessing: isProcessingActive,
              isActiveRecording: isRecordingActive,
              timestamp: Date.now()
            });
            
            // Additional status check during processing
            if (isProcessingActive) {
              socket.emit('check-processing-status', {
                filename: fileNameRef.current,
                userId,
                clerkId,
                workspaceId
              });
            }
          }
        } else if (needsProcessingRef.current && !processingCompleteRef.current) {
          // If socket is disconnected but we need processing, try to reconnect
          console.log('Socket disconnected but processing still needed - attempting to reconnect');
          if (!socket.connected) {
            socket.connect();
          }
        }
      }, needsProcessingRef.current ? 2000 : 5000); // More frequent during processing (every 2 seconds)

      keepAliveIntervalRef.current = keepAliveInterval;

      // Cleanup function for when component unmounts
      return () => {
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
        }
      };
    };

    // Setup socket event handlers (extracted to avoid nested function)
    const setupSocketEventHandlers = (socket: Socket) => {
      // Add handler for video processing complete
      socket.on('video-processed', (data) => {
        console.log('Server processed video:', data);
        if (data.filename === fileNameRef.current) {
          processingCompleteRef.current = true;
          
          // Show success message
          toast({
            title: "Recording Complete",
            description: "Your recording has been processed successfully.",
            duration: 5000
          });
          
          // Reset processing state
          setIsProcessing(false);
          needsProcessingRef.current = false;
          
          // Now we can notify about cleanup completion
          notifyCleanupComplete();
        }
      });
      
      // Add handler for processing error
      socket.on('processing-error', (data) => {
        console.error('Server reported processing error:', data);
        if (data.filename === fileNameRef.current) {
          setRecordingError(data.error || 'Unknown processing error');
          setIsProcessing(false);
          
          // Show error message
          toast({
            title: "Processing Failed",
            description: data.error || "Failed to process recording. Please try again.",
            variant: "destructive",
            duration: 8000
          });
          
          // Still need to notify about cleanup
          notifyCleanupComplete();
        }
      });

      // Add socket disconnect event listener with enhanced error handling and recovery
      socket.on('disconnect', (reason) => {
        console.log(`Socket disconnected. Reason: ${reason}`);
        
        // Clear heartbeat monitoring
        missedHeartbeatsRef.current = 0;
        
        // If we're still processing when disconnected, show a warning and attempt reconnection
        if (needsProcessingRef.current && !processingCompleteRef.current) {
          console.log('CRITICAL: Disconnection during processing/recording - attempting immediate aggressive reconnection');
          
          toast({
            title: "Connection Lost",
            description: "Connection to the server was lost during processing. Attempting to reconnect...",
            variant: "destructive"
          });
          
          // Force immediate reconnection with backoff strategy
          const attemptReconnect = (attempt = 1) => {
            if (attempt > 5) return; // Give up after 5 attempts
            
            console.log(`Reconnection attempt ${attempt}...`);
            socket.connect();
            
            // When reconnected, re-identify the user
            socket.once('connect', () => {
              console.log("Reconnected, re-identifying user");
              socket.emit('identify-user', {
                userId,
                clerkId,
                workspaceId
              });
              
              // If we were processing, also check the status
              if (needsProcessingRef.current && fileNameRef.current) {
                socket.emit('check-processing-status', {
                  filename: fileNameRef.current,
                  userId,
                  clerkId,
                  workspaceId
                });
              }
            });
            
            // If still not connected after 1s, try again with backoff
            setTimeout(() => {
              if (!socket.connected && needsProcessingRef.current) {
                attemptReconnect(attempt + 1);
              }
            }, attempt * 1000); // Increase delay with each attempt
          };
          
          attemptReconnect();
        }
        
        // Clear the keepalive interval
        if (keepAliveIntervalRef.current) {
          clearInterval(keepAliveIntervalRef.current);
          keepAliveIntervalRef.current = null;
        }
      });

      // Handle heartbeat acknowledgment
      socket.on('heartbeat-ack', () => {
        // Reset counter when we get an acknowledgment
        missedHeartbeatsRef.current = 0;
      });

      // Add handler for cleanup acknowledgment
      socket.on('cleanup-acknowledged', (data) => {
        console.log('Server acknowledged cleanup:', data);
        if (data.filename === fileNameRef.current) {
          console.log('Cleanup process complete');
          // Reset the filename since cleanup is done
          fileNameRef.current = '';
        }
      });
    };

    try {
      // Only setup socket when needed
      const newSocket = setupSocketConnection();
      if (newSocket && 'on' in newSocket) {  // Type guard to ensure it's a socket
        socketRef.current = newSocket;
      } else {
        console.error('Failed to initialize socket properly');
      }
    } catch (error) {
      console.error('Error setting up socket:', error);
    }
    
    return () => {
      // Cleanup socket when component unmounts or dependencies change
      if (socketRef.current && 'disconnect' in socketRef.current) {
        if (!needsProcessingRef.current) {
          console.log("Cleaning up socket connection");
          socketRef.current.disconnect();
        } else {
          console.log("Keeping socket connection open for processing");
        }
      }
    };
  }, [userId, workspaceId, clerkId, isRecording, isPaused, isProcessing, toast]);

  // Add separate effect to initialize socket on mount
  useEffect(() => {
    // Initialize socket connection when component mounts
    if (!socketRef.current) {
      console.log("Initializing socket connection on mount");
      const socket = io(SOCKET_SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 60000,
        autoConnect: true
      });
      
      // Identify user as soon as the socket connects
      socket.on('connect', () => {
        console.log("Socket connected, identifying user");
        socket.emit('identify-user', {
          userId,
          clerkId,
          workspaceId
        });
      });
      
      // Listen for user identification confirmation
      socket.on('user-identified', (data) => {
        console.log("User identified on socket:", data);
      });
      
      socketRef.current = socket;
    }
    
    return () => {
      // Final cleanup when component unmounts
      if (socketRef.current && !needsProcessingRef.current) {
        console.log("Final cleanup of socket connection");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId, workspaceId, clerkId]);

  // Return the public interface
  return {
    isRecording,
    isPaused,
    duration,
    startRecording: async (options: RecordOptions) => {
      try {
        // Reset any previous state
        chunksRef.current = [];
        setRecordingError(null);
        processingCompleteRef.current = false;
        setIsProcessing(false);
        
        // IMPORTANT: Set this flag to true as soon as recording starts, not just during processing
        needsProcessingRef.current = true;
        
        // Generate a unique filename for this recording
        fileNameRef.current = `recording-${userId}-${uuidv4()}.webm`;
        
        // Get display media with corresponding options
        const displayMediaOptions: any = {
          video: {
            cursor: "always",
            displaySurface: options.captureType === 'window' ? 'window' : 
                          options.captureType === 'tab' ? 'browser' : 'monitor'
          },
          audio: options.audioEnabled ? { 
            // Include system audio capture options with explicit browser support
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: 48000,
          } : false,
          selfBrowserSurface: "include" // Allow capturing browser tabs
        };
        
        // Show a helpful message to guide the user
        toast({
          title: "Starting Recording",
          description: "Please select a screen, window, or tab to record when prompted.",
          duration: 5000
        });

        // Add specific audio instructions
        if (options.audioEnabled) {
          toast({
            title: "Audio Recording Tip",
            description: "When sharing, be sure to check 'Share audio' or 'Share tab audio' option in the browser dialog to capture system sounds.",
            duration: 8000
          });
        }
        
        // Get screen capture stream with better error handling
        let displayStream;
        try {
          // Add explicit context instructions for better user understanding
          toast({
            title: "Browser Permission Required",
            description: "Please click 'Share' when your browser asks for screen recording permission.",
            duration: 8000
          });

          // Request screen sharing
          displayStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
          
          // Check if the video tracks are valid
          if (!displayStream.getVideoTracks().length) {
            throw new Error("No video track was captured. Please try selecting a screen again.");
          }
          
          // Successful capture - show success
          toast({
            title: "Screen Capture Started",
            description: "Your screen is now being recorded.",
            duration: 3000
          });
        } catch (mediaError: any) {
          console.error("Screen capture error:", mediaError);
          
          // Enhanced error reporting with browser-specific guidance
          let errorMessage = "Permission denied. Please allow screen recording in your browser settings and try again.";
          throw new Error(errorMessage);
        }
        
        // Optionally add microphone audio
        let combinedStream = displayStream;
        if (options.microphoneEnabled) {
          try {
            // Request microphone access
            const microphoneStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              },
              video: false
            });
            
            // Combine the streams if microphone is enabled
            const audioTracks = microphoneStream.getAudioTracks();
            if (audioTracks.length > 0) {
              audioTracks.forEach(track => displayStream.addTrack(track));
              console.log("Microphone added to recording");
            }
          } catch (micError: any) {
            console.warn("Microphone access error:", micError);
            toast({
              title: "Microphone access denied",
              description: "Recording will continue without voice audio.",
              variant: "destructive"
            });
          }
        }
        
        streamRef.current = combinedStream;
        
        // Add a listener for when the user manually stops the stream
        streamRef.current.getVideoTracks()[0].addEventListener('ended', () => {
          if (isRecording) {
            if (mediaRecorderRef.current) {
              mediaRecorderRef.current.stop();
            }
          }
        });
        
        // Get best MIME type for current browser
        const mimeType = 'video/webm';
        
        // Setup media recorder
        mediaRecorderRef.current = new MediaRecorder(combinedStream, {
          mimeType,
          videoBitsPerSecond: 3000000 // 3 Mbps
        });
        
        // Handle data available event
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
            
            // Send the chunk to the server via socket.io
            if (socketRef.current && socketRef.current.connected) {
              socketRef.current.emit('video-chunks', {
                filename: fileNameRef.current,
                chunks: event.data,
                userId,
                clerkId,
                workspaceId
              });
            }
          }
        };
        
        // When recording stops
        mediaRecorderRef.current.onstop = async () => {
          setIsRecording(false);
          setIsPaused(false);
          
          if (chunksRef.current.length > 0) {
            try {
              // Set processing flag
              needsProcessingRef.current = true; 
              setIsProcessing(true);
              
              toast({
                title: "Processing recording...",
                description: "Your recording is being processed. Please keep this window open.",
                duration: 10000
              });
              
              // Tell the server to process the completed video
              if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('process-video', {
                  userId,
                  clerkId,
                  workspaceId,
                  filename: fileNameRef.current
                });
              } else {
                throw new Error("Not connected to server");
              }
            } catch (error) {
              console.error('Error finalizing recording:', error);
              setRecordingError('Failed to process recording');
              setIsProcessing(false);
              
              // Use full cleanup on error
              fullCleanup();
            }
          }
          
          // Clean up just the recording resources, keep socket alive
          cleanupRecording();
        };
        
        // Start the recorder
        mediaRecorderRef.current.start(1000); // Collect data in 1-second chunks
        
        // Start timing the recording
        startTimeRef.current = Date.now();
        timerRef.current = setInterval(() => {
          if (!isPaused) {
            const currentDuration = Date.now() - startTimeRef.current - pausedTimeRef.current;
            setDuration(currentDuration);
          }
        }, 100);
        
        setIsRecording(true);
        
      } catch (error) {
        console.error('Error starting recording:', error);
        setRecordingError('Failed to start recording: ' + (error instanceof Error ? error.message : String(error)));
        setIsProcessing(false);
        fullCleanup();
        
        toast({
          title: "Recording failed",
          description: error instanceof Error ? error.message : "Could not start recording",
          variant: "destructive"
        });
      }
    },
    stopRecording: async () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      } else {
        needsProcessingRef.current = false;
        fullCleanup();
        setIsRecording(false);
        setIsPaused(false);
        setIsProcessing(false);
      }
    },
    pauseRecording: () => {
      if (mediaRecorderRef.current && isRecording && !isPaused) {
        mediaRecorderRef.current.pause();
        pausedTimeRef.current = Date.now() - startTimeRef.current;
        setIsPaused(true);
      }
    },
    resumeRecording: () => {
      if (mediaRecorderRef.current && isRecording && isPaused) {
        mediaRecorderRef.current.resume();
        startTimeRef.current = Date.now() - pausedTimeRef.current;
        setIsPaused(false);
      }
    },
    recordingError,
    isProcessing
  };
}; 