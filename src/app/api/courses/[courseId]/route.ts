import { client } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { AccessLevel, checkCourseAccess, handleUnauthorizedAccess } from '@/middleware/check-course-access'

// GET - Fetch a specific course with its lessons
export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params
    
    // Check if user has VIEW access to the course
    const accessCheck = await checkCourseAccess({
      courseId: courseId,
      requiredAccess: AccessLevel.VIEW
    })
    
    const unauthorizedResponse = handleUnauthorizedAccess(accessCheck)
    if (unauthorizedResponse) return unauthorizedResponse
    
    // At this point, we know accessCheck.isAuthorized is true
    // Get user ID for enrollment check
    const dbUser = await client.user.findUnique({
      where: { id: accessCheck.isAuthorized ? accessCheck.userId : '' },
      select: { id: true }
    })

    // Get course with lessons
    const course = await client.course.findUnique({
      where: { id: courseId },
      include: {
        User: {
          select: {
            firstname: true,
            lastname: true,
            image: true
          }
        },
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            Video: {
              select: {
                title: true,
                source: true
              }
            }
          }
        },
        enrollments: {
          where: {
            userId: dbUser?.id
          },
          take: 1
        },
        _count: {
          select: {
            lessons: true,
            enrollments: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { status: 404, message: 'Course not found' },
        { status: 404 }
      )
    }

    // Add access control flags
    const isOwner = course.userId === dbUser?.id
    const isEnrolled = course.enrollments && course.enrollments.length > 0
    const isAdmin = accessCheck.isAuthorized ? accessCheck.userRole === 'admin' : false
    const isInstructor = accessCheck.isAuthorized ? accessCheck.userRole === 'instructor' : false
    const canEdit = isOwner || isAdmin || isInstructor
    const canManage = isOwner || isAdmin

    return NextResponse.json({
      status: 200,
      data: {
        ...course,
        isOwner,
        isEnrolled,
        isAdmin,
        isInstructor,
        canEdit,
        canManage,
        enrollments: undefined // Remove enrollments from response
      }
    })
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { status: 500, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update a course
export async function PATCH(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params
    
    // Check if user has EDIT access to the course
    const accessCheck = await checkCourseAccess({
      courseId: courseId,
      requiredAccess: AccessLevel.EDIT
    })
    
    const unauthorizedResponse = handleUnauthorizedAccess(accessCheck)
    if (unauthorizedResponse) return unauthorizedResponse
    
    const requestData = await req.json()
    
    // Filter out currentStep and any other fields not in the schema
    const { currentStep, ...data } = requestData
    
    // Update course
    const updatedCourse = await client.course.update({
      where: { id: courseId },
      data
    })
    
    return NextResponse.json({
      status: 200,
      data: updatedCourse
    })
  } catch (error) {
    console.error('Error updating course:', error)
    return NextResponse.json(
      { status: 500, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a course
export async function DELETE(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params

    // Check if user has MANAGE access to the course
    const accessCheck = await checkCourseAccess({
      courseId: courseId,
      requiredAccess: AccessLevel.MANAGE
    })
    
    const unauthorizedResponse = handleUnauthorizedAccess(accessCheck)
    if (unauthorizedResponse) return unauthorizedResponse

    // Delete the course (cascades to lessons and enrollments due to Prisma schema)
    await client.course.delete({
      where: { id: courseId }
    })

    return NextResponse.json({
      status: 200,
      message: 'Course deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json(
      { status: 500, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 