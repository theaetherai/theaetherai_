import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'filled' | 'outlined'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'default', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md px-3 py-1 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          variant === 'default' && "border border-input bg-transparent shadow-sm focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 focus-visible:border-primary/40 hover:border-input/80",
          variant === 'filled' && "border-2 border-transparent bg-secondary/20 focus-visible:bg-transparent focus-visible:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary/30 hover:bg-secondary/30",
          variant === 'outlined' && "border-2 border-border/50 bg-transparent focus-visible:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary/20 hover:border-border",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
