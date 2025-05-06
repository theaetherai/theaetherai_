'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AlertTriangle, Database, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DatabaseContextProps {
  isConnected: boolean;
  error: Error | null;
  checkConnection: () => Promise<boolean>;
  lastChecked: Date | null;
}

const DatabaseContext = createContext<DatabaseContextProps>({
  isConnected: true,
  error: null,
  checkConnection: async () => true,
  lastChecked: null
});

export const useDatabase = () => useContext(DatabaseContext);

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider = ({ children }: DatabaseProviderProps) => {
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const checkConnection = async (): Promise<boolean> => {
    try {
      // Make a simple API call that requires database access
      const response = await fetch('/api/database-check', { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const connected = response.status !== 503 && response.ok;
      setIsConnected(connected);
      setLastChecked(new Date());
      
      if (!connected) {
        setError(new Error('Database connection failed'));
      } else {
        setError(null);
      }
      
      return connected;
    } catch (err) {
      setIsConnected(false);
      setError(err instanceof Error ? err : new Error('Database connection failed'));
      setLastChecked(new Date());
      return false;
    }
  };

  useEffect(() => {
    // Check connection on initial load
    checkConnection();
    
    // Set up periodic checks
    const interval = setInterval(() => {
      if (!isConnected && retryCount < 5) {
        checkConnection();
        setRetryCount(prev => prev + 1);
      }
    }, 30000); // Check every 30 seconds if disconnected
    
    return () => clearInterval(interval);
  }, [isConnected, retryCount]);

  if (!isConnected && error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <div className="max-w-lg w-full p-6 rounded-lg border-2 border-border/60 bg-background shadow-md">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <Database className="h-10 w-10 text-destructive" />
            </div>
          </div>
          
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <AlertTitle>Database Connection Error</AlertTitle>
            <AlertDescription>
              We're having trouble connecting to our database. This might be a temporary issue.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Our team has been notified and is working to fix this. Please try again in a few moments.
            </p>
            
            <div className="flex justify-center mt-4">
              <Button 
                onClick={() => {
                  checkConnection();
                  setRetryCount(0);
                }}
                className="flex items-center gap-2"
              >
                <RotateCw className="h-4 w-4" />
                Retry Connection
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DatabaseContext.Provider value={{ isConnected, error, checkConnection, lastChecked }}>
      {children}
    </DatabaseContext.Provider>
  );
}; 