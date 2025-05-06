'use client'
import React from 'react'
import { SignIn, useAuth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

const SignInPage = () => {
  const { isSignedIn } = useAuth()
  
  // Redirect to dashboard if already signed in
  if (isSignedIn) {
    redirect('/home')
  }

  return <SignIn />
}

export default SignInPage
