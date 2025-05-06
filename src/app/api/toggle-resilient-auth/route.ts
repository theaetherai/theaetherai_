import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = cookies()
  const currentMode = cookieStore.get('auth_mode')?.value
  
  // Toggle between modes or default to resilient if not set
  const newMode = currentMode === 'resilient' ? 'standard' : 'resilient'
  
  // Set cookie with the new mode
  cookieStore.set('auth_mode', newMode, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  })
  
  return NextResponse.json({ 
    success: true, 
    mode: newMode,
    message: `Authentication mode set to ${newMode}`
  })
}

export async function POST() {
  // Also handle POST for compatibility
  return GET()
} 