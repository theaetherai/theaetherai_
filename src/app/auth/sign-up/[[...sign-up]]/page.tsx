'use client'
import { SignUp, useAuth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default function SignUpPage() {
  const { isSignedIn } = useAuth()
  
  // Redirect to dashboard if already signed in
  if (isSignedIn) {
    redirect('/home')
  }

  return <SignUp />
}
