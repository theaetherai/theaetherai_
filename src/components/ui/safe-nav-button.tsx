'use client'

import { Button, ButtonProps } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useRouteAvailability } from '@/hooks/useRouteAvailability'

interface SafeNavButtonProps extends ButtonProps {
  href: string
  fallbackRoute?: string
  fallbackMessage?: string
  skipCheck?: boolean
}

/**
 * A Button component that validates routes before navigation
 * Prevents navigation to non-existent routes and shows a toast error message
 */
export function SafeNavButton({ 
  href, 
  children, 
  fallbackRoute,
  fallbackMessage = "This feature is not available yet",
  skipCheck = false,
  ...props 
}: SafeNavButtonProps) {
  const { checking, navigateSafely } = useRouteAvailability()

  const handleClick = () => {
    navigateSafely(href, {
      fallbackRoute,
      errorMessage: fallbackMessage,
      skipCheck
    })
  }

  return (
    <Button 
      onClick={handleClick} 
      disabled={checking || props.disabled}
      {...props}
    >
      {checking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
      {children}
    </Button>
  )
} 