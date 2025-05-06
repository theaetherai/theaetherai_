import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Database, RotateCw } from 'lucide-react'
import Link from 'next/link'
import RefreshButton from './refresh-button'

export const metadata = {
  title: 'Database Connection Error | AetherLMS',
  description: 'We\'re experiencing a temporary database connection issue.'
}

export default function DatabaseErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12 text-center bg-gradient-to-b from-background to-background/90">
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl opacity-80 pointer-events-none z-0"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl opacity-70 pointer-events-none z-0"></div>
      
      <div className="relative z-10 p-8 max-w-3xl rounded-xl border-2 border-border/70 bg-gradient-to-b from-background/95 to-background shadow-elevation-3 animate-fade-in">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <Database className="h-12 w-12 text-destructive" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-3 text-foreground flex items-center justify-center gap-2">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          Database Connection Error
        </h1>
        
        <div className="mb-8 space-y-4">
          <p className="text-lg text-muted-foreground">
            We're currently experiencing difficulties connecting to our database. This is usually a temporary issue.
          </p>
          
          <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground">
            <p>Error: Can't reach database server at <code>ep-flat-base-a5xtcuot.us-east-2.aws.neon.tech:5432</code></p>
          </div>
          
          <p className="text-muted-foreground">
            Our team has been automatically notified and is working to resolve this issue as quickly as possible.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <RefreshButton />
          
          <Link href="/">
            <Button className="w-full sm:w-auto">
              Return to Home Page
            </Button>
          </Link>
        </div>
        
        <div className="mt-8 text-sm text-muted-foreground">
          <p>If this problem persists, please contact our support team at <span className="font-medium">support@aetherlms.com</span></p>
        </div>
      </div>
    </div>
  )
} 