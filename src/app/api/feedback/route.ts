import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/prisma'
import { onAuthenticateUser } from '@/actions/user'
import { currentUser } from '@clerk/nextjs/server'

// POST - Create a new feedback entry
export async function POST(req: NextRequest) {
  try {
    // Check authorization
    const auth = await onAuthenticateUser()
    if (auth.status !== 200 && auth.status !== 201) {
      return NextResponse.json({ status: 401, message: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ status: 401, message: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID from database
    const dbUser = await client.user.findUnique({
      where: { clerkid: user.id },
      select: { id: true }
    })

    if (!dbUser) {
      return NextResponse.json({ status: 404, message: 'User not found' }, { status: 404 })
    }

    // Get request body
    const body = await req.json()
    const { type, itemId, rating, comment } = body

    // Validate required fields
    if (!type || !itemId || !rating) {
      return NextResponse.json(
        { status: 400, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate rating value
    if (rating !== 'positive' && rating !== 'negative') {
      return NextResponse.json(
        { status: 400, message: 'Invalid rating value' },
        { status: 400 }
      )
    }

    // Create feedback entry
    const feedbackEntry = await client.feedback.create({
      data: {
        type,
        itemId,
        rating,
        comment,
        userId: dbUser.id
      }
    })

    return NextResponse.json(
      { status: 201, message: 'Feedback submitted', data: feedbackEntry },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return NextResponse.json(
      { status: 500, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Fetch feedback (for analytics purposes)
export async function GET(req: NextRequest) {
  try {
    // Check authorization
    const auth = await onAuthenticateUser()
    if (auth.status !== 200 && auth.status !== 201) {
      return NextResponse.json({ status: 401, message: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ status: 401, message: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database with role information
    const dbUser = await client.user.findUnique({
      where: { clerkid: user.id },
      select: { id: true }
    })

    if (!dbUser) {
      return NextResponse.json({ status: 404, message: 'User not found' }, { status: 404 })
    }

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const itemId = searchParams.get('itemId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build filter conditions
    const whereClause: any = {}
    
    if (type) {
      whereClause.type = type
    }
    
    if (itemId) {
      whereClause.itemId = itemId
    }
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // Fetch feedback entries
    const feedback = await client.feedback.findMany({
      where: whereClause,
      include: {
        User: {
          select: {
            firstname: true,
            lastname: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(
      { status: 200, data: feedback },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { status: 500, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 