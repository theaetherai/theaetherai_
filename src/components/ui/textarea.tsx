import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'filled' | 'outlined'
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md px-3 py-2 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
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
Textarea.displayName = "Textarea"

export { Textarea }
