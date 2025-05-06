'use client'

import { useState, useEffect, ReactNode } from 'react'
import { checkIfRouteExists } from '@/hooks/useRouteAvailability'

interface FeatureCheckProps {
  /**
   * The route to check for feature availability
   */
  route: string
  
  /**
   * Content to display if the feature is available
   */
  children: ReactNode
  
  /**
   * Content to display if the feature is not available
   */
  fallback?: ReactNode
  
  /**
   * If true, will directly render children without checking
   */
  skipCheck?: boolean
  
  /**
   * Time in ms to wait before showing the fallback (prevents flashing on fast connections)
   */
  loadingDelay?: number
}

/**
 * A component that conditionally renders content based on whether a feature (route/API) exists
 * Useful for gradually rolling out features without breaking the UI
 */
export function FeatureCheck({
  route,
  children,
  fallback,
  skipCheck = false,
  loadingDelay = 300
}: FeatureCheckProps) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [showLoading, setShowLoading] = useState(false)
  
  useEffect(() => {
    if (skipCheck) {
      setIsAvailable(true)
      return
    }
    
    const loadingTimer = setTimeout(() => {
      if (isAvailable === null) {
        setShowLoading(true)
      }
    }, loadingDelay)
    
    checkIfRouteExists(route).then(available => {
      setIsAvailable(available)
      setShowLoading(false)
    })
    
    return () => clearTimeout(loadingTimer)
  }, [route, skipCheck, loadingDelay])
  
  // If we're still checking and not showing loading state, render nothing
  if (isAvailable === null && !showLoading) {
    return null
  }
  
  // If we're showing loading state, render a minimal loading indicator
  if (isAvailable === null && showLoading) {
    return (
      <div className="flex items-center justify-center h-8 w-full">
        <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-primary animate-spin" />
      </div>
    )
  }
  
  // If the feature is available or we're skipping checks, render children
  if (isAvailable || skipCheck) {
    return <>{children}</>
  }
  
  // If the feature is not available and we have a fallback, render it
  if (fallback) {
    return <>{fallback}</>
  }
  
  // If no fallback provided, render nothing
  return null
}

/**
 * A component that only renders its children if a feature is NOT available
 * Useful for showing alternative UIs when a feature is still in development
 */
export function FeatureUnavailableOnly({
  route,
  children,
  skipCheck = false,
  loadingDelay = 300
}: Omit<FeatureCheckProps, 'fallback'>) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [showLoading, setShowLoading] = useState(false)
  
  useEffect(() => {
    if (skipCheck) {
      setIsAvailable(false) // opposite of FeatureCheck
      return
    }
    
    const loadingTimer = setTimeout(() => {
      if (isAvailable === null) {
        setShowLoading(true)
      }
    }, loadingDelay)
    
    checkIfRouteExists(route).then(available => {
      setIsAvailable(available)
      setShowLoading(false)
    })
    
    return () => clearTimeout(loadingTimer)
  }, [route, skipCheck, loadingDelay])
  
  // If still checking or feature is available, don't show anything
  if (isAvailable === null || isAvailable === true) {
    return null
  }
  
  // If feature is definitely not available, show the fallback
  return <>{children}</>
} 