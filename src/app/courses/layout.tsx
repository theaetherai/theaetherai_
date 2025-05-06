import React from 'react'
import { Inter as FontSans } from 'next/font/google'
import { cn } from '@/lib/utils'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})

interface Props {
  children: React.ReactNode
}

const CoursesLayout = async ({ children }: Props) => {
  // No authentication checks - courses layout is public

  return (
    <div className={cn(
      'min-h-screen bg-background antialiased',
      fontSans.variable
    )}>
      <main className="relative">
        {children}
      </main>
    </div>
  )
}

export default CoursesLayout 