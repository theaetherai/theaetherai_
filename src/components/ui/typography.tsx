import { cn } from "@/lib/utils"
import React from "react"

type HeadingProps = {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  size?: "1" | "2" | "3" | "4" | "5" | "6"
  children?: React.ReactNode
  className?: string
}

export function Heading({ 
  as: Tag = "h2", 
  size, 
  children, 
  className,
  ...props
}: HeadingProps & React.HTMLAttributes<HTMLHeadingElement>) {
  // Default size to match the element if not specified
  const headingSize = size || Tag.replace("h", "") as HeadingProps["size"]
  
  return (
    <Tag 
      className={cn(
        "font-heading tracking-tight",
        headingSize === "1" && "text-4xl font-extrabold md:text-5xl lg:text-6xl leading-tighter",
        headingSize === "2" && "text-3xl font-bold md:text-4xl leading-tight",
        headingSize === "3" && "text-2xl font-semibold md:text-3xl leading-tight",
        headingSize === "4" && "text-xl font-semibold leading-snug",
        headingSize === "5" && "text-lg font-medium leading-snug",
        headingSize === "6" && "text-base font-medium leading-normal",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

type TextProps = {
  as?: "p" | "span" | "div"
  size?: "xs" | "sm" | "base" | "lg" | "xl"
  variant?: "default" | "muted" | "lead"
  children?: React.ReactNode
  className?: string
}

export function Text({
  as: Tag = "p",
  size = "base",
  variant = "default",
  children,
  className,
  ...props
}: TextProps & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={cn(
        size === "xs" && "text-xs",
        size === "sm" && "text-sm",
        size === "base" && "text-base",
        size === "lg" && "text-lg",
        size === "xl" && "text-xl",
        variant === "default" && "text-foreground",
        variant === "muted" && "text-muted-foreground",
        variant === "lead" && "text-xl text-foreground/80 leading-relaxed",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

export function TypographyH1({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <Heading as="h1" size="1" className={className} {...props}>{children}</Heading>
}

export function TypographyH2({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <Heading as="h2" size="2" className={className} {...props}>{children}</Heading>
}

export function TypographyH3({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <Heading as="h3" size="3" className={className} {...props}>{children}</Heading>
}

export function TypographyH4({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <Heading as="h4" size="4" className={className} {...props}>{children}</Heading>
}

export function TypographyP({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <Text as="p" className={cn("leading-relaxed mb-4 last:mb-0", className)} {...props}>{children}</Text>
}

export function TypographyLead({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <Text as="p" variant="lead" className={className} {...props}>{children}</Text>
}

export function TypographyLarge({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Text as="div" size="lg" className={cn("leading-relaxed", className)} {...props}>{children}</Text>
}

export function TypographySmall({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <Text as="span" size="sm" className={className} {...props}>{children}</Text>
}

export function TypographyMuted({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <Text as="p" variant="muted" className={cn("leading-normal", className)} {...props}>{children}</Text>
} 