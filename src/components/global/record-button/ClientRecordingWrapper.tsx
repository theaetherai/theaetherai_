'use client'

import React, { useState } from 'react';
import { RecordButton } from './RecordButton';
import { RecordModal, RecordOptions } from './RecordModal';
import { useRecording } from './useRecording';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ClientRecordingWrapperProps {
  userId: string;
  clerkId: string;
  workspaceId: string;
  className?: string;
}

/**
 * Client-side wrapper component that safely uses the useRecording hook
 * This isolates hook calls to a client-only component
 */
const ClientRecordingWrapper: React.FC<ClientRecordingWrapperProps> = ({
  userId,
  clerkId,
  workspaceId,
  className
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // It's safe to use the hook here because this component will only render on the client
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

export default ClientRecordingWrapper; 