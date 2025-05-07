import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getPrisma } from '../../../lib/prisma'

/**
 * This is a template for how to safely use Prisma in API routes
 * Follow this pattern to avoid build errors on Vercel
 */
export async function GET(
  req: Request
) {
  try {
    // 1. Check for required env vars
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not set')
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }

    // 2. Check authentication (if needed)
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 3. Get current user (if needed)
    let user
    try {
      user = await currentUser()
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 401 })
      }
    } catch (clerkError) {
      console.error('Clerk Error:', clerkError)
      return NextResponse.json({ error: 'Auth error' }, { status: 500 })
    }

    // 4. Get database client INSIDE the handler using getPrisma()
    //    NOT at the top level of the file
    const prisma = await getPrisma()
    
    // 5. Make database queries inside try/catch
    try {
      const items = await prisma.example.findMany({
        where: {
          userId: user.id
        },
        take: 10
      })
      
      return NextResponse.json({ items })
    } catch (dbError) {
      console.error('Database Error:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Server Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
} 