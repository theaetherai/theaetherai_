'use client'

import React from 'react'
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query'
import Sidebar from '@/components/global/sidebar'
import { Toaster } from '@/components/ui/toaster'
import ErrorBoundary from '@/components/global/error-boundary'

// Define workspace interface to match what's used in GlobalHeader
interface WorkspaceType {
  id: string
  name: string
  type: string
  [key: string]: any
}

interface ClientWorkspaceLayoutProps {
  children: React.ReactNode
  workspaceId: string
  workspace: WorkspaceType
  initialWorkspaces: any
  initialNotifications: any
  degradedMode?: boolean // Make this optional with a default value
}

// This is a client component that can safely use React hooks and client-only code
export default function ClientWorkspaceLayout({
  children,
  workspaceId,
  workspace,
  initialWorkspaces,
  initialNotifications,
  degradedMode = false, // Default to false if not provided
}: ClientWorkspaceLayoutProps) {
  // Create and hydrate a QueryClient with the prefetched data
  const queryClient = new QueryClient()
  
  // Set up prefetched data in the query client
  try {
    if (initialWorkspaces) queryClient.setQueryData(['user-workspaces'], initialWorkspaces)
    if (initialNotifications) queryClient.setQueryData(['user-notifications'], initialNotifications)
  } catch (error) {
    console.error("Error setting query data:", error);
  }
  
  return (
    <ErrorBoundary>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className="flex h-screen w-screen">
          <Sidebar activeWorkspaceId={workspaceId} />
          <div className="w-full pt-20 p-6 overflow-y-scroll overflow-x-hidden">
            {degradedMode && (
              <div className="fixed top-0 left-0 right-0 bg-amber-50 border-b border-amber-200 p-2 z-50">
                <p className="text-amber-700 text-sm text-center">
                  Using limited functionality mode due to temporary service issues.
                </p>
              </div>
            )}
            <div>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </div>
          </div>
          <Toaster />
        </div>
      </HydrationBoundary>
    </ErrorBoundary>
  )
} 