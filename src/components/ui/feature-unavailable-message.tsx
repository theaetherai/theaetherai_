'use client'

import { AlertTriangle, Construction, Info, FileText, Calculator } from 'lucide-react'
import { ReactNode } from 'react'

type FeatureMessageType = 'warning' | 'info' | 'coming-soon' | 'quiz' | 'assignment'

interface FeatureUnavailableMessageProps {
  /**
   * The title of the feature that's unavailable
   */
  title: string
  
  /**
   * Optional description to explain more about the feature
   */
  description?: string
  
  /**
   * The type of message to show
   */
  type?: FeatureMessageType
  
  /**
   * Optional action buttons or other content to render
   */
  action?: ReactNode
  
  /**
   * Optional className to apply to the container
   */
  className?: string
}

/**
 * A component that displays a message for features that are not yet implemented
 * Used to provide a better user experience when features are still in development
 */
export function FeatureUnavailableMessage({
  title,
  description,
  type = 'warning',
  action,
  className = ''
}: FeatureUnavailableMessageProps) {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-8 w-8 text-amber-500" />
      case 'info':
        return <Info className="h-8 w-8 text-blue-500" />
      case 'coming-soon':
        return <Construction className="h-8 w-8 text-purple-500" />
      case 'quiz':
        return <Calculator className="h-8 w-8 text-green-500" />
      case 'assignment':
        return <FileText className="h-8 w-8 text-orange-500" />
    }
  }
  
  const getBackgroundColor = () => {
    switch (type) {
      case 'warning':
        return 'bg-amber-950/20 border-amber-800/30'
      case 'info':
        return 'bg-blue-950/20 border-blue-800/30'
      case 'coming-soon':
        return 'bg-purple-950/20 border-purple-800/30'
      case 'quiz':
        return 'bg-green-950/20 border-green-800/30'
      case 'assignment':
        return 'bg-orange-950/20 border-orange-800/30'
    }
  }
  
  const getTextColor = () => {
    switch (type) {
      case 'warning':
        return 'text-amber-300'
      case 'info':
        return 'text-blue-300'
      case 'coming-soon':
        return 'text-purple-300'
      case 'quiz':
        return 'text-green-300'
      case 'assignment':
        return 'text-orange-300'
    }
  }
  
  return (
    <div className={`p-6 rounded-lg border ${getBackgroundColor()} ${className}`}>
      <div className="flex flex-col items-center text-center">
        {getIcon()}
        <h3 className={`mt-4 text-xl font-medium ${getTextColor()}`}>
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-white/60">
            {description}
          </p>
        )}
        {action && (
          <div className="mt-4">
            {action}
          </div>
        )}
      </div>
    </div>
  )
} 