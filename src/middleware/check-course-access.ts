import { client } from "@/lib/prisma"
import { currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export enum AccessLevel {
  VIEW = "view",       // Can view course content (enrolled students, instructors, admins, owner)
  EDIT = "edit",       // Can edit course content (instructors for assigned courses, admins, owner)
  MANAGE = "manage",   // Can manage course settings and students (admins, owner)
  ADMIN = "admin"      // Full administrative access (admins only)
}

interface CheckCourseAccessOptions {
  courseId: string
  requiredAccess: AccessLevel
}

type AccessCheckResult = 
  | { isAuthorized: false; message: string; statusCode: number }
  | { isAuthorized: true; userId: string; userRole: string }

/**
 * Middleware to check if the current user has the required access level for a course
 */
export async function checkCourseAccess({ courseId, requiredAccess }: CheckCourseAccessOptions): Promise<AccessCheckResult> {
  try {
    // Get current user
    const user = await currentUser()
    if (!user) {
      return {
        isAuthorized: false,
        message: "Unauthorized",
        statusCode: 401
      }
    }

    // Get user from database with role information
    const dbUser = await client.user.findUnique({
      where: { clerkid: user.id }
    })

    if (!dbUser) {
      return {
        isAuthorized: false,
        message: "User not found",
        statusCode: 404
      }
    }

    // Get user's role (default to "student" if not set)
    const userRole = dbUser.role || "student"

    // Get course with enrollment information
    const course = await client.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: {
          where: {
            userId: dbUser.id
          },
          take: 1
        }
      }
    })

    if (!course) {
      return {
        isAuthorized: false,
        message: "Course not found",
        statusCode: 404
      }
    }

    // Check user's access level
    const isAdmin = userRole === "admin"
    const isInstructor = userRole === "instructor"
    const isOwner = course.userId === dbUser.id
    const isEnrolled = course.enrollments.length > 0

    // Admin has access to everything
    if (isAdmin) {
      return {
        isAuthorized: true,
        userId: dbUser.id,
        userRole
      }
    }

    // Check access based on required level
    switch (requiredAccess) {
      case AccessLevel.VIEW:
        // Owner, enrolled students, or instructors can view
        if (isOwner || isEnrolled || isInstructor) {
          return {
            isAuthorized: true,
            userId: dbUser.id,
            userRole
          }
        }
        break

      case AccessLevel.EDIT:
        // Owner or instructors can edit
        if (isOwner || isInstructor) {
          return {
            isAuthorized: true,
            userId: dbUser.id,
            userRole
          }
        }
        break

      case AccessLevel.MANAGE:
      case AccessLevel.ADMIN:
        // Only owner can manage
        if (isOwner) {
          return {
            isAuthorized: true,
            userId: dbUser.id,
            userRole
          }
        }
        break
    }

    // If we've reached here, user does not have required access
    return {
      isAuthorized: false,
      message: "You do not have permission to access this resource",
      statusCode: 403
    }
  } catch (error) {
    console.error("Error checking course access:", error)
    return {
      isAuthorized: false,
      message: "Internal server error",
      statusCode: 500
    }
  }
}

/**
 * Helper function to handle API responses for unauthorized access
 */
export function handleUnauthorizedAccess(result: AccessCheckResult) {
  if (!result.isAuthorized) {
    return NextResponse.json(
      { status: result.statusCode, message: result.message },
      { status: result.statusCode }
    )
  }
  return null
} 