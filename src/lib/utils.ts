import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const truncateString = (string: string, slice?: number) => {
  return string.slice(0, slice || 30) + '...'
}

/**
 * Formats a duration in minutes to a readable string
 * @param minutes Duration in minutes
 * @returns Formatted duration string (e.g., "1h 15m" or "30m")
 */
export const formatDuration = (minutes: number): string => {
  if (!minutes) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  }
  
  return `${mins}m`;
}

/**
 * Cleans and fixes potential issues with Cloudinary URLs
 * @param url The original Cloudinary URL
 * @returns A cleaned URL
 */
export const cleanCloudinaryUrl = (url: string): string => {
  if (!url) return '';
  
  // Fix double cloudinary URLs if present
  if (url.includes('cloudinary.com') && url.indexOf('cloudinary.com') !== url.lastIndexOf('cloudinary.com')) {
    // Extract just the last cloudinary URL
    const parts = url.split('cloudinary.com');
    if (parts.length >= 2) {
      return `https://res.cloudinary.com${parts[parts.length - 1]}`;
    }
  }
  
  return url;
}

export function onCloseApp() {
  // @ts-ignore
  window.ipcRenderer.send("closeApp")
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retry attempts
 * @param baseDelayMs Base delay in milliseconds (will increase exponentially)
 * @param onError Function to call when an error occurs
 * @returns Promise resolving to the result of the function
 */
export async function retry<T>(
  fn: () => Promise<T>, 
  maxRetries: number, 
  baseDelayMs: number,
  onError?: (error: Error, attempt: number) => void
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (onError) {
        onError(lastError, attempt);
      }
      
      if (attempt < maxRetries) {
        // Exponential backoff with jitter
        const delay = baseDelayMs * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}
