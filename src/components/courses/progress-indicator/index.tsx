'use client'

import React from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressIndicatorProps {
  progress: number // 0-100
  size?: 'sm' | 'md' | 'lg'
  type?: 'circular' | 'linear'
  showPercentage?: boolean
  showLabel?: boolean
  label?: string
  className?: string
}

export default function ProgressIndicator({
  progress,
  size = 'md',
  type = 'circular',
  showPercentage = false,
  showLabel = false,
  label = 'Progress',
  className
}: ProgressIndicatorProps) {
  // Ensure progress is between 0-100
  const validProgress = Math.min(100, Math.max(0, progress))
  const isComplete = validProgress === 100
  
  // Size maps
  const sizeClasses = {
    sm: {
      container: 'h-4 w-4',
      circle: 'h-4 w-4',
      linear: 'h-1',
      text: 'text-xs'
    },
    md: {
      container: 'h-6 w-6',
      circle: 'h-6 w-6',
      linear: 'h-2',
      text: 'text-sm'
    },
    lg: {
      container: 'h-8 w-8',
      circle: 'h-8 w-8',
      linear: 'h-3',
      text: 'text-base'
    }
  }

  if (type === 'circular') {
    return (
      <div className={cn("flex items-center", className)}>
        <div className={cn("relative", sizeClasses[size].container)}>
          {isComplete ? (
            <CheckCircle2 
              className={cn(
                "text-green-500", 
                sizeClasses[size].circle
              )} 
            />
          ) : (
            <>
              <Circle 
                className={cn(
                  "text-[#3A3A3A]", 
                  sizeClasses[size].circle
                )} 
              />
              <svg 
                className="absolute inset-0"
                viewBox="0 0 100 100"
              >
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="none"
                  stroke="currentColor" 
                  strokeWidth="8"
                  strokeDasharray={`${validProgress * 2.51} 251`}
                  strokeLinecap="round"
                  className="text-green-500"
                  transform="rotate(-90 50 50)"
                />
              </svg>
            </>
          )}
        </div>

        {(showPercentage || showLabel) && (
          <div className={cn("ml-2", sizeClasses[size].text)}>
            {showLabel && <span className="text-[#9D9D9D]">{label}: </span>}
            {showPercentage && <span className="text-white">{validProgress}%</span>}
          </div>
        )}
      </div>
    )
  }
  
  // Linear progress bar
  return (
    <div className={cn("w-full", className)}>
      {(showLabel || showPercentage) && (
        <div className={cn("flex justify-between mb-1", sizeClasses[size].text)}>
          {showLabel && <span className="text-[#9D9D9D]">{label}</span>}
          {showPercentage && <span className="text-white">{validProgress}%</span>}
        </div>
      )}
      
      <div 
        className={cn(
          "w-full bg-[#2A2A2A] rounded-full overflow-hidden", 
          sizeClasses[size].linear
        )}
      >
        <div 
          className={cn(
            "bg-green-500 h-full rounded-full transition-all duration-300 ease-in-out",
            isComplete ? "bg-green-500" : "bg-blue-500"
          )}
          style={{ width: `${validProgress}%` }}
        />
      </div>
    </div>
  )
} 