import { client } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch all users (admin only)
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { status: 401, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database with role information
    const dbUser = await client.user.findUnique({
      where: { clerkid: user.id }
    })

    if (!dbUser) {
      return NextResponse.json(
        { status: 404, message: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is an admin
    if (dbUser.role !== 'admin') {
      return NextResponse.json(
        { status: 403, message: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Fetch all users with role information
    const users = await client.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        image: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      status: 200,
      data: users
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { status: 500, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 