'use client'

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { InfoCircledIcon, ExclamationTriangleIcon, CheckCircledIcon } from '@radix-ui/react-icons';
import { Separator } from '@/components/ui/separator';
import { PermissionStatus } from './permissionHelpers';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

// Import helpers without using hooks directly
import * as PermissionHelpers from './permissionHelpers';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (options: RecordOptions) => void;
}

export interface RecordOptions {
  captureType: 'screen' | 'window' | 'tab';
  audioEnabled: boolean;
  microphoneEnabled: boolean;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  onStart,
}) => {
  const [options, setOptions] = useState<RecordOptions>({
    captureType: 'screen',
    audioEnabled: true,
    microphoneEnabled: true,
  });
  
  const [permissionChecking, setPermissionChecking] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<{
    screenCapture: PermissionStatus;
    microphone: PermissionStatus;
  }>({
    screenCapture: PermissionStatus.UNKNOWN,
    microphone: PermissionStatus.UNKNOWN
  });
  const [browserSupported, setBrowserSupported] = useState(true);
  const [browserInfo, setBrowserInfo] = useState(PermissionHelpers.getBrowserInfo());

  // Check permissions when modal opens - ensure all hooks are called at the top level
  useEffect(() => {
    if (isOpen) {
      const checkCapabilities = async () => {
        setPermissionChecking(true);
        
        // Check browser support - move to inside the effect
        const screenSupported = PermissionHelpers.isScreenCaptureSupported();
        const micSupported = PermissionHelpers.isMicrophoneSupported();
        setBrowserSupported(screenSupported);
        
        // Update browser info inside the effect
        setBrowserInfo(PermissionHelpers.getBrowserInfo());
        
        if (screenSupported) {
          // Check current permission status
          const status = await PermissionHelpers.checkPermissionStatus();
          setPermissionStatus(status);
        }
        
        setPermissionChecking(false);
      };
      
      checkCapabilities();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(options);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Start Recording</DialogTitle>
          <DialogDescription>
            Configure your recording options below.
          </DialogDescription>
        </DialogHeader>

        {/* Browser Compatibility Check */}
        {!browserSupported && (
          <Alert variant="destructive" className="mb-4">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>Unsupported Browser</AlertTitle>
            <AlertDescription>
              Your browser doesn't support screen recording. Please use Chrome, Edge, or Firefox.
            </AlertDescription>
          </Alert>
        )}

        {permissionChecking ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <p>Checking recording capabilities...</p>
          </div>
        ) : (
          <>
            {/* Permission Status Information */}
            <div className={`bg-muted/50 border rounded-md p-3 text-sm flex gap-2 mb-2 ${
              permissionStatus.screenCapture === PermissionStatus.DENIED ? 'border-destructive' : ''
            }`}>
              {permissionStatus.screenCapture === PermissionStatus.DENIED ? (
                <ExclamationTriangleIcon className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              ) : (
                <InfoCircledIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${
                  permissionStatus.screenCapture === PermissionStatus.DENIED 
                    ? 'text-destructive' 
                    : 'text-blue-700 dark:text-blue-300'
                }`}>
                  {permissionStatus.screenCapture === PermissionStatus.DENIED 
                    ? 'Screen Recording Permission Denied' 
                    : 'Browser Permissions Required'}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {permissionStatus.screenCapture === PermissionStatus.DENIED ? (
                    <>
                      Your browser has denied screen recording permissions. 
                      Please check your browser settings: click the lock/site settings icon in the address bar 
                      and enable screen capture permissions.
                    </>
                  ) : (
                    <>
                      When you click "Start Recording", your browser will ask for permission to access your screen. 
                      You must click "Share" in that prompt to begin recording.
                    </>
                  )}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">What would you like to record?</h3>
                  <RadioGroup
                    defaultValue={options.captureType}
                    onValueChange={(value) =>
                      setOptions({ ...options, captureType: value as RecordOptions['captureType'] })
                    }
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="screen" id="screen" />
                      <Label htmlFor="screen">Entire Screen</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="window" id="window" />
                      <Label htmlFor="window">Application Window</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="tab" id="tab" />
                      <Label htmlFor="tab">Browser Tab</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Separator />

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Audio Options</h3>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label htmlFor="system-audio" className="font-medium">Capture System Audio</Label>
                      <p className="text-xs text-muted-foreground">Record sounds from your computer</p>
                      <p className="text-xs text-amber-500 mt-1">
                        Note: You must click "Share audio" in the browser dialog when selecting your screen/window.
                      </p>
                    </div>
                    <Switch
                      id="system-audio"
                      checked={options.audioEnabled}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, audioEnabled: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label htmlFor="microphone" className="font-medium">Capture Microphone</Label>
                      <p className="text-xs text-muted-foreground">Record your voice while recording</p>
                    </div>
                    <div className="flex items-center">
                      {permissionStatus.microphone === PermissionStatus.DENIED && (
                        <span className="text-destructive mr-2 text-xs">Denied</span>
                      )}
                      <Switch
                        id="microphone"
                        checked={options.microphoneEnabled}
                        disabled={permissionStatus.microphone === PermissionStatus.DENIED}
                        onCheckedChange={(checked) =>
                          setOptions({ ...options, microphoneEnabled: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Browser Compatibility Info */}
              <div className="text-xs text-muted-foreground mb-4">
                <p className="flex items-center">
                  <span className="mr-1">Current browser:</span>
                  {browserInfo.isChrome ? (
                    <><CheckCircledIcon className="h-3 w-3 text-green-500 mr-1" /> Chrome (Fully Compatible)</>
                  ) : browserInfo.isEdge ? (
                    <><CheckCircledIcon className="h-3 w-3 text-green-500 mr-1" /> Edge (Fully Compatible)</>
                  ) : browserInfo.isFirefox ? (
                    <><CheckCircledIcon className="h-3 w-3 text-green-500 mr-1" /> Firefox (Fully Compatible)</>
                  ) : browserInfo.isSafari ? (
                    <><ExclamationTriangleIcon className="h-3 w-3 text-amber-500 mr-1" /> Safari (Limited Compatibility)</>
                  ) : (
                    <><InfoCircledIcon className="h-3 w-3 text-blue-500 mr-1" /> {browserInfo.vendor || "Unknown"} (Compatibility May Vary)</>
                  )}
                </p>
                <p className="mt-1">
                  <strong>Note:</strong> System audio capture may not work in all browsers
                </p>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={!browserSupported || permissionStatus.screenCapture === PermissionStatus.DENIED}
                >
                  Start Recording
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}; 