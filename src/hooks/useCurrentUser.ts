'use client'

import { getUserProfile } from '@/actions/user'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'

// Enhanced version of useCurrentUser with fallback handling
export const useCurrentUser = () => {
  const [fallbackMode, setFallbackMode] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  
  // Use React Query with retry and error handling
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-profile'],
    queryFn: getUserProfile,
    retry: 2,
    retryDelay: 1000,
    // Don't refetch on window focus or component mount - only explicitly
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 300000, // 5 minutes
  })
  
  // When error occurs, set fallback mode
  useEffect(() => {
    if (error) {
      console.warn('User profile fetch error:', error)
      setFallbackMode(true)
    } else if (data?.status === 404) {
      console.warn('User not found (404)')
      setFallbackMode(true)
    } else if (data?.status === 200 && data?.data) {
      // Reset fallback mode if we successfully get data
      setFallbackMode(false)
    }
  }, [data, error])
  
  // Retry authentication after a delay
  const retryAuthentication = () => {
    setRetryCount(prev => prev + 1)
    refetch()
  }
  
  return {
    user: data?.data || null,
    isLoading,
    error,
    fallbackMode,
    retryCount,
    retryAuthentication,
  }
} 