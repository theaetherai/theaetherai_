import React from 'react'
import { onAuthenticateUser, getNotifications } from '../../actions/user'
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query'
import { getWorkSpaces } from '../../actions/workspace'

type Props = {
  children: React.ReactNode
}

const HomeLayout = async ({ children }: Props) => {
  const query = new QueryClient()

  try {
    // Try to authenticate user but don't force redirect
    // Pass false to disable dynamic mode and allow static generation
    const auth = await onAuthenticateUser(false)
    
    // Only prefetch data if user is authenticated
    if (auth.status === 200 || auth.status === 201) {
      if (auth.user?.workspace && auth.user.workspace.length > 0) {
        // Prefetch workspace data - with dynamic mode disabled
        await query.prefetchQuery({
          queryKey: ['user-workspaces'],
          queryFn: () => getWorkSpaces(false),
        })

        // Prefetch notifications - with dynamic mode disabled
        await query.prefetchQuery({
          queryKey: ['user-notifications'],
          queryFn: () => getNotifications(false),
        })
      }
    }
  } catch (error) {
    console.error("Error in HomeLayout:", error);
    // Continue with rendering even if prefetching fails
  }

  return (
    <HydrationBoundary state={dehydrate(query)}>
      <div className="w-full">
        {children}
      </div>
    </HydrationBoundary>
  )
}

export default HomeLayout 