/**
 * Permission Helper Utilities for Screen Recording
 * 
 * This file contains helper functions to check, request, and troubleshoot
 * browser permissions for screen recording.
 */

// Helper to safely check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';

/**
 * Check if the browser supports screen capture
 * @returns {boolean} Whether the browser supports screen capture
 */
export const isScreenCaptureSupported = (): boolean => {
  if (!isBrowser) return false;
  
  return (
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getDisplayMedia === 'function'
  );
};

/**
 * Check if microphone access is supported
 * @returns {boolean} Whether the browser supports microphone access
 */
export const isMicrophoneSupported = (): boolean => {
  if (!isBrowser) return false;
  
  return (
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
};

/**
 * Types of screen capture permission issues
 */
export enum PermissionStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  PROMPT = 'prompt',
  UNSUPPORTED = 'unsupported',
  UNKNOWN = 'unknown',
}

/**
 * Check current permission status for screen capture
 * Note: This doesn't actually check screen capture permissions directly
 * as browsers don't expose this via the Permissions API yet.
 * We check camera access as a proxy for permissions health.
 */
export const checkPermissionStatus = async (): Promise<{
  microphone: PermissionStatus;
  screenCapture: PermissionStatus;
}> => {
  const result = {
    microphone: PermissionStatus.UNKNOWN,
    screenCapture: PermissionStatus.UNKNOWN,
  };

  // Skip if not in browser
  if (!isBrowser) {
    return {
      microphone: PermissionStatus.UNSUPPORTED,
      screenCapture: PermissionStatus.UNSUPPORTED,
    };
  }

  // Check if the Permissions API is supported
  if (!navigator.permissions) {
    console.log('Permissions API not supported');
    return {
      microphone: isMicrophoneSupported() ? PermissionStatus.PROMPT : PermissionStatus.UNSUPPORTED,
      screenCapture: isScreenCaptureSupported() ? PermissionStatus.PROMPT : PermissionStatus.UNSUPPORTED,
    };
  }

  // Check microphone permission
  try {
    const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    result.microphone = micPermission.state as PermissionStatus;
  } catch (error) {
    console.error('Error checking microphone permission:', error);
    result.microphone = isMicrophoneSupported() ? PermissionStatus.UNKNOWN : PermissionStatus.UNSUPPORTED;
  }

  // Screen capture permissions can't be directly queried with the Permissions API in most browsers
  // So we check if the API exists and assume PROMPT state if it does
  result.screenCapture = isScreenCaptureSupported() ? PermissionStatus.PROMPT : PermissionStatus.UNSUPPORTED;

  return result;
};

/**
 * Request microphone permission explicitly to trigger the browser prompt
 * This can be used to "warm up" permission dialogs before starting recording
 */
export const requestMicrophonePermission = async (): Promise<boolean> => {
  if (!isBrowser || !isMicrophoneSupported()) {
    return false;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    // Stop all tracks to release the microphone
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Error requesting microphone permission:', error);
    return false;
  }
};

/**
 * Gets browser information to help diagnose permission issues
 */
export const getBrowserInfo = () => {
  if (!isBrowser) {
    return {
      userAgent: '',
      vendor: '',
      platform: '',
      isChrome: false,
      isFirefox: false,
      isEdge: false,
      isSafari: false,
      isElectron: false,
      isHttps: false,
      isLocalhost: false,
    };
  }
  
  return {
    userAgent: navigator.userAgent,
    vendor: navigator.vendor,
    platform: navigator.platform,
    isChrome: navigator.userAgent.indexOf('Chrome') > -1,
    isFirefox: navigator.userAgent.indexOf('Firefox') > -1,
    isEdge: navigator.userAgent.indexOf('Edg') > -1,
    isSafari: navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') === -1,
    isElectron: navigator.userAgent.toLowerCase().indexOf('electron') > -1,
    isHttps: window.location.protocol === 'https:',
    isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  };
};

/**
 * Generate guidance for fixing permission issues based on browser and error
 */
export const getPermissionGuidance = (error: Error): string => {
  if (!isBrowser) return '';
  
  const browserInfo = getBrowserInfo();
  
  // Common guidance for all browsers
  let guidance = "To fix permission issues with screen recording:\n";
  
  if (error.message.includes('Permission denied') || error.message.includes('NotAllowedError')) {
    if (browserInfo.isChrome) {
      guidance += "- Click the lock/site settings icon in your address bar\n";
      guidance += "- Make sure Screen Capture is set to 'Allow'\n";
      guidance += "- Refresh the page and try again\n";
    } else if (browserInfo.isFirefox) {
      guidance += "- Click the shield icon or site info button in the address bar\n";
      guidance += "- Make sure 'Use the Camera and Microphone' permissions are enabled\n";
      guidance += "- Refresh the page and try again\n";
    } else if (browserInfo.isEdge) {
      guidance += "- Click the lock icon in your address bar\n"; 
      guidance += "- Check Media permissions and ensure they're set to 'Allow'\n";
      guidance += "- Refresh the page and try again\n";
    } else if (browserInfo.isSafari) {
      guidance += "- Open Safari Preferences > Websites > Camera & Microphone\n";
      guidance += "- Ensure permissions are enabled for this site\n";
      guidance += "- Note: Safari has limited support for screen recording\n";
    } else {
      guidance += "- Check your browser settings to allow screen capture for this site\n";
      guidance += "- Try using Chrome, Edge, or Firefox for best compatibility\n";
    }
  } else if (!browserInfo.isHttps && !browserInfo.isLocalhost) {
    guidance += "- Screen recording requires a secure context (HTTPS)\n";
    guidance += "- This site must use HTTPS for screen recording to work\n";
  } else if (error.message.includes('not supported') || error.message.includes('getDisplayMedia')) {
    guidance += "- Your browser doesn't support screen recording\n";
    guidance += "- Please try using Chrome, Edge, or Firefox (latest versions)\n";
    guidance += "- Make sure your browser is up to date\n";
  }
  
  return guidance;
};

/**
 * Attempt to check if system permissions (OS-level) might be blocking access
 * This is a best-effort approach as browsers don't provide direct OS permission info
 */
export const checkSystemPermissionsBlocking = async (): Promise<boolean> => {
  if (!isBrowser) return false;
  
  // Test microphone as a proxy for system permissions health
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return false; // Not blocking if we got microphone access
  } catch (error) {
    // If we get NotAllowedError despite not having prompted, it might be OS blocking
    if (error instanceof Error && 
        error.name === 'NotAllowedError') {
      // Check the permission status separately without using hooks
      const status = await checkPermissionStatus();
      if (status.microphone !== PermissionStatus.DENIED) {
        return true; // Likely OS blocking
      }
    }
    return false;
  }
}; 