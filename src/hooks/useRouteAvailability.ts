'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Global cache for route availability checks to reduce API calls
const routeAvailabilityCache = new Map<string, { available: boolean, timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * A hook that provides utilities for checking route availability before navigation
 * Caches results to minimize API calls and provides a way to navigate safely
 */
export function useRouteAvailability() {
  const router = useRouter()
  const [checking, setChecking] = useState(false)

  /**
   * Checks if a route exists using a HEAD request
   * If the route is in the cache and not expired, returns the cached result
   * 
   * @param route The route to check
   * @returns A promise that resolves to a boolean indicating if the route exists
   */
  const checkRouteExists = useCallback(async (route: string): Promise<boolean> => {
    setChecking(true)
    try {
      // Check cache first
      const now = Date.now()
      const cachedResult = routeAvailabilityCache.get(route)
      
      if (cachedResult && (now - cachedResult.timestamp < CACHE_TTL)) {
        return cachedResult.available
      }
      
      // For API routes, use the verify-route endpoint
      if (route.startsWith('/api/')) {
        try {
          const response = await fetch('/api/verify-route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ route })
          })
          
          if (!response.ok) {
            throw new Error('Failed to verify route')
          }
          
          const result = await response.json()
          const available = result?.data?.exists === true
          
          // Update cache
          routeAvailabilityCache.set(route, { available, timestamp: now })
          return available
        } catch (error) {
          console.error('Error checking API route:', error)
          return false
        }
      }
      
      // For page routes, use a HEAD request
      try {
        const response = await fetch(route, { 
          method: 'HEAD',
          headers: { 'Cache-Control': 'no-cache' }
        })
        
        const available = response.status !== 404
        
        // Update cache
        routeAvailabilityCache.set(route, { available, timestamp: now })
        return available
      } catch (error) {
        console.error('Error checking page route:', error)
        return false
      }
    } finally {
      setChecking(false)
    }
  }, [])

  /**
   * Navigates to a route only if it exists
   * If the route doesn't exist, shows an error toast
   * 
   * @param route The route to navigate to
   * @param options Optional configuration
   */
  const navigateSafely = useCallback(async (
    route: string, 
    options?: { 
      fallbackRoute?: string,
      errorMessage?: string,
      skipCheck?: boolean
    }
  ) => {
    const { 
      fallbackRoute, 
      errorMessage = 'This feature is not available yet',
      skipCheck = false
    } = options || {}

    // If skipCheck is true, navigate directly
    if (skipCheck) {
      router.push(route)
      return
    }

    setChecking(true)
    
    try {
      const routeExists = await checkRouteExists(route)
      
      if (routeExists) {
        router.push(route)
      } else if (fallbackRoute) {
        router.push(fallbackRoute)
        toast.warning(errorMessage)
      } else {
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Navigation error:', error)
      toast.error('Navigation error')
      
      if (fallbackRoute) {
        router.push(fallbackRoute)
      }
    } finally {
      setChecking(false)
    }
  }, [router, checkRouteExists])

  return {
    checking,
    checkRouteExists,
    navigateSafely
  }
}

/**
 * Directly check if a route exists without using the hook
 * Useful for one-off checks in components that don't need the full hook
 */
export async function checkIfRouteExists(route: string): Promise<boolean> {
  // If the route is in the cache and not expired, return the cached result
  const now = Date.now()
  const cachedResult = routeAvailabilityCache.get(route)
  
  if (cachedResult && (now - cachedResult.timestamp < CACHE_TTL)) {
    return cachedResult.available
  }

  try {
    if (route.startsWith('/api/')) {
      // For API routes, use the verify-route endpoint
      const response = await fetch('/api/verify-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route })
      })
      
      if (!response.ok) {
        throw new Error('Failed to verify route')
      }
      
      const result = await response.json()
      const available = result?.data?.exists === true
      
      // Update cache
      routeAvailabilityCache.set(route, { available, timestamp: now })
      return available
    } else {
      // For page routes, use a HEAD request
      const response = await fetch(route, { 
        method: 'HEAD',
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      const available = response.status !== 404
      
      // Update cache
      routeAvailabilityCache.set(route, { available, timestamp: now })
      return available
    }
  } catch (error) {
    console.error('Error checking route:', error)
    return false
  }
} 