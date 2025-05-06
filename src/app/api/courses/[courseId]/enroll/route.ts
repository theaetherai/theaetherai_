import { client } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

// POST - Enroll in a course
export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { status: 401, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { courseId } = params

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

    // Check if course exists
    const course = await client.course.findUnique({
      where: { id: courseId },
      select: { 
        id: true,
        title: true,
        userId: true 
      }
    })

    if (!course) {
      return NextResponse.json(
        { status: 404, message: 'Course not found' },
        { status: 404 }
      )
    }

    // Check if user is already enrolled
    const existingEnrollment = await client.enrollment.findFirst({
      where: {
        userId: dbUser.id,
        courseId: courseId
      }
    })

    if (existingEnrollment) {
      return NextResponse.json({
        status: 200,
        message: 'Already enrolled in this course',
        data: existingEnrollment
      })
    }

    // Create enrollment
    const enrollment = await client.enrollment.create({
      data: {
        User: {
          connect: { id: dbUser.id }
        },
        Course: {
          connect: { id: courseId }
        }
      }
    })

    return NextResponse.json({
      status: 201,
      message: 'Successfully enrolled in course',
      data: enrollment
    }, { status: 201 })
  } catch (error) {
    console.error('Error enrolling in course:', error)
    return NextResponse.json(
      { status: 500, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Unenroll from a course
export async function DELETE(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { status: 401, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { courseId } = params

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

    // Check if enrollment exists
    const enrollment = await client.enrollment.findFirst({
      where: {
        userId: dbUser.id,
        courseId: courseId
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { status: 404, message: 'Enrollment not found' },
        { status: 404 }
      )
    }

    // Delete the enrollment and associated progress
    await client.learningProgress.deleteMany({
      where: {
        userId: dbUser.id,
        Lesson: {
          courseId: courseId
        }
      }
    })

    await client.enrollment.delete({
      where: { id: enrollment.id }
    })

    return NextResponse.json({
      status: 200,
      message: 'Successfully unenrolled from course'
    })
  } catch (error) {
    console.error('Error unenrolling from course:', error)
    return NextResponse.json(
      { status: 500, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 