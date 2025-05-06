import { currentUser } from "@clerk/nextjs/server";
import { cache } from "react";
import { User } from "@clerk/nextjs/server";

// Cache timeout in milliseconds (10 minutes)
const CACHE_TIMEOUT = 10 * 60 * 1000;

// Circuit breaker state to track Clerk API failures
let circuitBreakerFailures = 0;
let lastFailureTime = 0;
let isCircuitOpen = false;
const FAILURE_THRESHOLD = 3;
const CIRCUIT_RESET_TIME = 30000; // 30 seconds

// Storage for temporary session cache
const userSessionCache = new Map();

// Enhanced currentUser function with resilience
export const resilientCurrentUser = cache(async () => {
  // Check if circuit breaker is open
  if (isCircuitOpen) {
    const timeElapsed = Date.now() - lastFailureTime;
    if (timeElapsed < CIRCUIT_RESET_TIME) {
      console.log("Auth circuit breaker open, using cached auth if available");
      // Circuit is open, try to use cache
      return null;
    } else {
      // Reset circuit breaker after timeout
      console.log("Resetting auth circuit breaker");
      circuitBreakerFailures = 0;
      isCircuitOpen = false;
    }
  }

  try {
    // Use AbortController to set a timeout for the Clerk request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    // Try to get user from Clerk
    const user = await Promise.race([
      currentUser(),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error("Clerk API timeout")), 3000)
      )
    ]) as User | null;
    
    clearTimeout(timeoutId);
    
    // Reset circuit breaker on success
    circuitBreakerFailures = 0;
    
    // Update cache with current user data and timestamp
    if (user && user.id) {
      userSessionCache.set(user.id, {
        user,
        timestamp: Date.now()
      });
    }
    
    return user;
  } catch (error) {
    console.error("Clerk authentication error:", error);
    
    // Record failure for circuit breaker
    circuitBreakerFailures++;
    lastFailureTime = Date.now();
    
    // Trip circuit breaker if threshold reached
    if (circuitBreakerFailures >= FAILURE_THRESHOLD) {
      console.log(`Auth circuit breaker tripped after ${circuitBreakerFailures} failures`);
      isCircuitOpen = true;
    }
    
    // Return null on auth failure - caller should handle this case
    return null;
  }
});

// Store user session in cache (called after successful DB lookup)
export function cacheUserSession(clerkId: string, userData: any) {
  if (!clerkId) return;
  
  userSessionCache.set(clerkId, {
    userData,
    timestamp: Date.now()
  });
}

// Get cached user session if available
export function getCachedUserSession(clerkId: string) {
  if (!clerkId) return null;
  
  const cached = userSessionCache.get(clerkId);
  if (!cached) return null;
  
  // Check if cache is still valid
  if (Date.now() - cached.timestamp > CACHE_TIMEOUT) {
    userSessionCache.delete(clerkId);
    return null;
  }
  
  return cached.userData;
}

// Helper to log auth errors without disrupting flow
export function logAuthError(source: string, error: any) {
  console.error(`Auth error in ${source}:`, 
    error?.message || error?.toString() || "Unknown error");
  
  // Could add monitoring/reporting here
  return null;
} 