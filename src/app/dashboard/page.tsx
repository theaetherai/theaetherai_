import { onAuthenticateUser } from '@/actions/user'
import { redirect } from 'next/navigation'
import React from 'react'

export default async function DashboardPage() {
  try {
    // Authentication
    const auth = await onAuthenticateUser()
    
    // Redirect to workspace if authenticated
    if (auth.status === 200 || auth.status === 201) {
      if (auth.user?.workspace && auth.user.workspace.length > 0) {
        redirect(`/dashboard/${auth.user.workspace[0].id}`)
      }
    }
    
    // Redirect to sign-in if not authenticated
    redirect('/auth/sign-in')
  } catch (error) {
    console.error("Dashboard page error:", error);
    
    // Always return a valid React component
    return (
      <div className="p-8 text-center">
        <p>Redirecting to sign in...</p>
      </div>
    )
  }
}
