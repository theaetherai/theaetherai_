import { client } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Search for courses with various filters
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { status: 401, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''
    const sortBy = searchParams.get('sortBy') || 'newest'
    const enrolled = searchParams.get('enrolled') === 'true'
    const created = searchParams.get('created') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    // Get user ID from clerk ID
    const dbUser = await client.user.findUnique({
      where: { clerkid: user.id },
      select: { id: true }
    })

    if (!dbUser) {
      return NextResponse.json(
        { status: 404, message: 'User not found' },
        { status: 404 }
      )
    }

    // Build where conditions
    let whereConditions: any = {}

    // Add search filter
    if (query) {
      whereConditions.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    }

    // Filter by enrollment if requested
    if (enrolled) {
      whereConditions.enrollments = {
        some: {
          userId: dbUser.id
        }
      }
    }

    // Filter by created courses if requested
    if (created) {
      whereConditions.userId = dbUser.id
    }

    // Determine sort order
    let orderBy: any = {}
    switch (sortBy) {
      case 'oldest':
        orderBy.createdAt = 'asc'
        break
      case 'popular':
        orderBy.enrollments = { _count: 'desc' }
        break
      case 'alphabetical':
        orderBy.title = 'asc'
        break
      case 'newest':
      default:
        orderBy.createdAt = 'desc'
        break
    }

    // Get total count for pagination
    const totalCount = await client.course.count({
      where: whereConditions
    })

    // Get courses
    const courses = await client.course.findMany({
      where: whereConditions,
      orderBy,
      skip,
      take: limit,
      include: {
        User: {
          select: {
            firstname: true,
            lastname: true,
            image: true
          }
        },
        _count: {
          select: {
            lessons: true,
            enrollments: true
          }
        },
        enrollments: dbUser ? {
          where: {
            userId: dbUser.id
          },
          take: 1
        } : undefined
      }
    })

    // Add isEnrolled flag to each course
    const coursesWithEnrollment = courses.map(course => ({
      ...course,
      isEnrolled: course.enrollments?.length > 0,
      enrollments: undefined // Remove enrollments from response
    }))

    return NextResponse.json({
      status: 200,
      data: coursesWithEnrollment,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        currentPage: page,
        perPage: limit
      }
    })
  } catch (error) {
    console.error('Error searching courses:', error)
    return NextResponse.json(
      { status: 500, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 