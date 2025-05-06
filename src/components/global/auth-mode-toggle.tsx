'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Shield, ShieldAlert } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function AuthModeToggle() {
  const [currentMode, setCurrentMode] = useState<string>('standard')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  
  // Load current mode from cookie on mount
  useEffect(() => {
    // Check for auth_mode cookie
    const cookies = document.cookie.split(';')
    const modeCookie = cookies.find(cookie => cookie.trim().startsWith('auth_mode='))
    if (modeCookie) {
      const mode = modeCookie.split('=')[1]
      setCurrentMode(mode)
    }
  }, [])
  
  const toggleMode = async () => {
    setIsLoading(true)
    
    try {
      // Call our toggle API
      const response = await fetch('/api/toggle-resilient-auth')
      const data = await response.json()
      
      if (data.success) {
        setCurrentMode(data.mode)
        
        toast({
          title: 'Auth Mode Changed',
          description: `Switched to ${data.mode} authentication mode`,
          duration: 3000,
        })
        
        // Reload the page to apply the change
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle authentication mode',
        variant: 'destructive',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Button
      variant={currentMode === 'resilient' ? 'default' : 'outline'}
      size="sm"
      onClick={toggleMode}
      disabled={isLoading}
      className={`flex items-center gap-1.5 ${
        currentMode === 'resilient' 
          ? 'bg-primary text-primary-foreground' 
          : ''
      }`}
    >
      {currentMode === 'resilient' ? (
        <>
          <Shield className="h-4 w-4" />
          <span>Resilient Auth</span>
        </>
      ) : (
        <>
          <ShieldAlert className="h-4 w-4" />
          <span>Standard Auth</span>
        </>
      )}
    </Button>
  )
} 