import { client } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

// PATCH - Update a user's role (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const body = await req.json()
    const { role } = body

    // Validate role
    const validRoles = ['student', 'instructor', 'admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { status: 400, message: 'Invalid role. Must be student, instructor, or admin' },
        { status: 400 }
      )
    }

    // Check if target user exists
    const targetUser = await client.user.findUnique({
      where: { id }
    })

    if (!targetUser) {
      return NextResponse.json(
        { status: 404, message: 'Target user not found' },
        { status: 404 }
      )
    }

    // Update the user's role
    const updatedUser = await client.user.update({
      where: { id },
      data: { role }
    })

    return NextResponse.json({
      status: 200,
      message: 'User role updated successfully',
      data: {
        id: updatedUser.id,
        role
      }
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { status: 500, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 