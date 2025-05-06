import { client } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch all courses (with possible filtering)
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
    const onlyMine = searchParams.get('onlyMine') === 'true'
    const searchQuery = searchParams.get('search') || ''
    
    // Base query conditions
    let whereCondition: any = {}
    
    // Add search filter if provided
    if (searchQuery) {
      whereCondition.OR = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } }
      ]
    }
    
    // Filter by user's courses if requested
    if (onlyMine) {
      whereCondition.userId = { equals: (await client.user.findUnique({ where: { clerkid: user.id } }))?.id }
    }

    const courses = await client.course.findMany({
      where: whereCondition,
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      status: 200,
      data: courses
    })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { status: 500, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new course
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { status: 401, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { 
      title, 
      description,
      shortDescription,
      price,
      discountPrice,
      thumbnailUrl,
      category,
      level,
      bestseller,
      featured,
      popular,
      published,
      requirements,
      objectives,
      targetAudience
    } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { status: 400, message: 'Title is required' },
        { status: 400 }
      )
    }

    // Get user ID from clerk ID
    const dbUser = await client.user.findUnique({
      where: { clerkid: user.id }
    })

    if (!dbUser) {
      return NextResponse.json(
        { status: 404, message: 'User not found' },
        { status: 404 }
      )
    }

    // Create the course with all fields from the request
    const course = await client.course.create({
      data: {
        title,
        description,
        shortDescription,
        price: price ? parseFloat(price) : undefined,
        discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
        thumbnailUrl,
        category,
        level,
        bestseller: bestseller || false,
        featured: featured || false,
        popular: popular || false,
        published: published || false,
        requirements: requirements || [],
        objectives: objectives || [],
        targetAudience,
        User: {
          connect: { id: dbUser.id }
        }
      }
    })

    return NextResponse.json({
      status: 201,
      data: course
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json(
      { status: 500, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 