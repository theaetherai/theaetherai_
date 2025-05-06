'use client'

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { RecordButton } from './RecordButton';
import { RecordModal, RecordOptions } from './RecordModal';
import { useRecording } from './useRecording';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { getUserProfile } from '@/actions/user';

interface RecordButtonContainerProps {
  workspaceId: string;
  className?: string;
}

const RecordButtonContainer: React.FC<RecordButtonContainerProps> = ({
  workspaceId,
  className
}) => {
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [databaseUserId, setDatabaseUserId] = useState<string | null>(null);
  const [isClientSide, setIsClientSide] = useState(false);
  
  // Check when we're on client side
  useEffect(() => {
    setIsClientSide(true);
  }, []);
  
  // Fetch the user's database UUID on component mount
  useEffect(() => {
    if (user?.id) {
      getUserProfile().then(result => {
        if (result?.status === 200 && result.data?.id) {
          setDatabaseUserId(result.data.id);
        }
      });
    }
  }, [user?.id]);

  // Return a placeholder while loading
  if (!isClientSide || !user) {
    return (
      <RecordButton
        isRecording={false}
        isPaused={false}
        isProcessing={false}
        duration={0}
        onClick={() => {}}
        className={className}
      />
    );
  }
  
  if (isClientSide && databaseUserId && user?.id) {
    return <ClientSideRecording 
      userId={databaseUserId} 
      clerkId={user.id} 
      workspaceId={workspaceId} 
      className={className} 
    />;
  }
  
  // Fallback while loading user data
  return (
    <RecordButton
      isRecording={false}
      isPaused={false}
      isProcessing={false}
      duration={0}
      onClick={() => {}}
      className={className}
    />
  );
};

// Internal component that uses hooks - only rendered on client side
const ClientSideRecording = ({
  userId,
  clerkId,
  workspaceId,
  className
}: {
  userId: string;
  clerkId: string;
  workspaceId: string;
  className?: string;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // It's safe to use the hook here because the parent component ensures we're on the client
  const {
    isRecording,
    isPaused,
    duration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    isProcessing,
    recordingError
  } = useRecording({
    userId,
    clerkId,
    workspaceId
  });

  const handleButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else if (!isProcessing) {
      setIsModalOpen(true);
    }
  };

  const handleStartRecording = async (options: RecordOptions) => {
    setIsModalOpen(false);
    await startRecording(options);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {isProcessing && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Processing Recording</AlertTitle>
          <AlertDescription>
            Please keep this window open until processing completes. 
            Closing this window may cause your recording to be lost.
          </AlertDescription>
        </Alert>
      )}
      
      {recordingError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Recording Error</AlertTitle>
          <AlertDescription>{recordingError}</AlertDescription>
        </Alert>
      )}
      
      <RecordButton
        isRecording={isRecording}
        isPaused={isPaused}
        isProcessing={isProcessing}
        duration={duration}
        onClick={handleButtonClick}
        className={className}
      />
      
      <RecordModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onStart={handleStartRecording}
      />
    </>
  );
};

export default RecordButtonContainer; 