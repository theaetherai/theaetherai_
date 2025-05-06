'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useCurrentUser } from '@/hooks/useCurrentUser'

// Create context
interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  connectionError: Error | null
  reconnectAttempts: number
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionError: null,
  reconnectAttempts: 0
})

// Hook to use socket
export const useSocket = () => useContext(SocketContext)

interface SocketProviderProps {
  children: React.ReactNode
  workspaceId?: string
}

/**
 * Socket Provider Component
 * Provides socket connection to the application
 */
export const SocketProvider: React.FC<SocketProviderProps> = ({ 
  children,
  workspaceId
}) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<Error | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const { user, fallbackMode } = useCurrentUser()
  
  // Initialize socket connection
  useEffect(() => {
    // Make sure this only runs on the client side
    if (typeof window === 'undefined') return;
    
    try {
      // Determine socket URL with fallbacks
      const socketUrl = process.env.NEXT_PUBLIC_EXPRESS_SERVER_URL || 
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
      const socketInstance = io(socketUrl, socketOptions);
      setSocket(socketInstance);
      
      // Set up event listeners
      socketInstance.on('connect', () => {
        console.log('Socket connected:', socketInstance.id);
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);
        
        // Identify user to server if we have user info
        if (user?.id || workspaceId) {
          socketInstance.emit('identify-user', {
            userId: user?.id || (fallbackMode ? 'anonymous-user' : undefined),
            workspaceId: workspaceId
          });
        }
      });
      
      socketInstance.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
      });
      
      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnectionError(error);
        setIsConnected(false);
      });
      
      socketInstance.on('reconnect', (attemptNumber) => {
        console.log(`Socket reconnected after ${attemptNumber} attempts`);
        setReconnectAttempts(attemptNumber);
        setIsConnected(true);
        
        // Identify again after reconnection
        if (user?.id || workspaceId) {
          socketInstance.emit('identify-user', {
            userId: user?.id || (fallbackMode ? 'anonymous-user' : undefined),
            workspaceId: workspaceId
          });
        }
      });
      
      // Start heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        if (socketInstance && socketInstance.connected) {
          socketInstance.emit('heartbeat', {
            timestamp: Date.now(),
            userId: user?.id,
            workspaceId: workspaceId
          });
        }
      }, 30000); // 30 second interval
      
      // Cleanup
      return () => {
        clearInterval(heartbeatInterval);
        if (socketInstance) {
          socketInstance.disconnect();
        }
      };
    } catch (error) {
      console.error('Error initializing socket:', error);
      setConnectionError(error as Error);
    }
  }, [user, workspaceId, fallbackMode]);
  
  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        connectionError,
        reconnectAttempts
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export default SocketProvider 