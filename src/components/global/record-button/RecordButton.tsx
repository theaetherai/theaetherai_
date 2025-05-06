'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { VideoIcon, StopCircleIcon, LoaderIcon } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface RecordButtonProps {
  isRecording: boolean;
  isPaused: boolean;
  isProcessing: boolean;
  duration: number;
  onClick: () => void;
  className?: string;
}

export const RecordButton: React.FC<RecordButtonProps> = ({
  isRecording,
  isPaused,
  isProcessing,
  duration,
  onClick,
  className,
}) => {
  // Format duration as mm:ss
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isRecording ? "destructive" : isProcessing ? "secondary" : "outline"}
            size="icon"
            onClick={onClick}
            disabled={isProcessing}
            className={cn(
              "transition-all duration-300 elevation-2",
              isRecording && "animate-pulse border-2 border-destructive/50",
              isPaused && "opacity-70",
              isProcessing && "animate-pulse",
              !isRecording && !isProcessing && "sleek-border bg-background hover:bg-secondary/20",
              className
            )}
          >
            {isProcessing ? (
              <LoaderIcon className="h-5 w-5 animate-spin" />
            ) : isRecording ? (
              <div className="flex items-center gap-2">
                <StopCircleIcon className="h-5 w-5" />
                {duration > 0 && <span className="text-xs font-medium">{formatDuration(duration)}</span>}
              </div>
            ) : (
              <VideoIcon className="h-5 w-5 text-primary" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-card border-border text-foreground">
          {isProcessing ? "Processing..." : isRecording ? "Stop Recording" : "Start Recording"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 