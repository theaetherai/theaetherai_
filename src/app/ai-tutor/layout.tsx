import React from 'react'
import { onAuthenticateUser, getNotifications } from '@/actions/user'
import { redirect } from 'next/navigation'
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query'
import { getWorkSpaces } from '@/actions/workspace'

type Props = {
  children: React.ReactNode
}

const AiTutorLayout = async ({ children }: Props) => {
  const auth = await onAuthenticateUser()
  if (!auth.user?.workspace) redirect('/auth/sign-in')
  if (!auth.user.workspace.length) redirect('/auth/sign-in')
  
  // Use the first workspace as the active one
  const workspaceId = auth.user.workspace[0].id

  const query = new QueryClient()

  await query.prefetchQuery({
    queryKey: ['user-workspaces'],
    queryFn: () => getWorkSpaces(),
  })

  await query.prefetchQuery({
    queryKey: ['user-notifications'],
    queryFn: () => getNotifications(),
  })

  return (
    <HydrationBoundary state={dehydrate(query)}>
      <div className="w-full">
        {children}
      </div>
    </HydrationBoundary>
  )
}

export default AiTutorLayout 