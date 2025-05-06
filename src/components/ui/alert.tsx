import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        primary: 
          "border-primary/20 bg-primary/10 text-primary-foreground dark:border-primary/30 [&>svg]:text-primary",
        secondary: 
          "border-secondary/20 bg-secondary/10 text-secondary-foreground dark:border-secondary/30 [&>svg]:text-secondary",
        accent: 
          "border-accent/20 bg-accent/10 text-accent-foreground dark:border-accent/30 [&>svg]:text-accent",
        info: 
          "border-secondary/20 bg-secondary/10 text-secondary-foreground dark:border-secondary/30 [&>svg]:text-secondary",
        success: 
          "border-[#26C281]/20 bg-[#26C281]/10 text-[#26C281] dark:border-[#26C281]/30 [&>svg]:text-[#26C281]",
        warning: 
          "border-[#FDCA65]/20 bg-[#FDCA65]/10 text-amber-700 dark:text-amber-200 dark:border-[#FDCA65]/30 [&>svg]:text-amber-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
