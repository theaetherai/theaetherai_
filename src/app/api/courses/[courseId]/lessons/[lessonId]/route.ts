import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { currentUser } from "@clerk/nextjs/server"

function isValidUUID(uuid: string | undefined) {
  return typeof uuid === 'string' && /^[0-9a-fA-F-]{36}$/.test(uuid)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { courseId: string, lessonId: string } }
) {
  const { courseId, lessonId } = params
  console.log(`[ROUTE_DEBUG] PATCH request received for courseId=${courseId}, lessonId=${lessonId}`)
  
  if (!isValidUUID(courseId) || !isValidUUID(lessonId)) {
    console.error(`[ROUTE_DEBUG] Invalid UUID format: courseId=${courseId}, lessonId=${lessonId}`)
    return NextResponse.json(
      { error: `Invalid courseId or lessonId: courseId='${courseId}', lessonId='${lessonId}'` },
      { status: 400 }
    )
  }
  try {
    console.log('[ROUTE_DEBUG] Authenticating user with Clerk')
    const user = await currentUser()
    
    if (!user) {
      console.error('[ROUTE_DEBUG] Authentication failed - no user found')
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    console.log(`[ROUTE_DEBUG] User authenticated: ${user.id}`)
    
    // Get the request body
    const body = await req.json()
    console.log('[ROUTE_DEBUG] Request body keys:', Object.keys(body))
    
    // Log quiz-specific data if present
    if (body.questions) {
      console.log('[ROUTE_DEBUG] Questions data type:', typeof body.questions)
      console.log('[ROUTE_DEBUG] Questions data length:', 
        typeof body.questions === 'string' ? body.questions.length : 'not a string')
      console.log('[ROUTE_DEBUG] Questions sample:', 
        typeof body.questions === 'string' 
          ? body.questions.substring(0, 100) + '...' 
          : JSON.stringify(body.questions).substring(0, 100) + '...')
      
      try {
        // Try to parse if it's a string
        if (typeof body.questions === 'string') {
          const parsed = JSON.parse(body.questions)
          console.log('[ROUTE_DEBUG] Parsed questions count:', 
            Array.isArray(parsed) ? parsed.length : 'not an array')
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log('[ROUTE_DEBUG] First question:', JSON.stringify(parsed[0], null, 2))
          }
        }
      } catch (err) {
        console.error('[ROUTE_DEBUG] Error parsing questions:', err)
      }
    }
    
    // Check if this is a progress update (completed field present)
    if (body.completed !== undefined) {
      console.log('[ROUTE_DEBUG] Processing lesson progress update')
      // Verify lesson exists and belongs to the course
      const existingLesson = await prisma.lesson.findUnique({
        where: {
          id: lessonId,
          courseId
        }
      })
      
      if (!existingLesson) {
        console.error('[ROUTE_DEBUG] Lesson not found or does not belong to the course')
        return NextResponse.json(
          { error: "Lesson not found or does not belong to the course" },
          { status: 404 }
        )
      }

      // Get user ID from database
      const dbUser = await prisma.user.findUnique({
        where: { 
          clerkid: user.id 
        },
        select: {
          id: true
        }
      })
      
      if (!dbUser) {
        console.error('[ROUTE_DEBUG] Database user not found')
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        )
      }
      
      console.log(`[ROUTE_DEBUG] Database user found: ${dbUser.id}`)

      // First check if progress exists
      const existingProgress = await prisma.learningProgress.findFirst({
        where: {
          userId: dbUser.id,
          lessonId: lessonId
        }
      })
      
      let progress
      if (existingProgress) {
        // Update existing progress
        console.log('[ROUTE_DEBUG] Updating existing progress')
        progress = await prisma.learningProgress.update({
          where: {
            id: existingProgress.id
          },
          data: {
            completed: body.completed
          }
        })
      } else {
        // Create new progress
        console.log('[ROUTE_DEBUG] Creating new progress record')
        progress = await prisma.learningProgress.create({
          data: {
            userId: dbUser.id,
            lessonId: lessonId,
            completed: body.completed
          }
        })
      }
      
      console.log('[ROUTE_DEBUG] Progress update successful:', progress)
      return NextResponse.json(
        { 
          status: 200,
          data: progress
        },
        { status: 200 }
      )
    }
    
    // If not a progress update, handle lesson update
    console.log('[ROUTE_DEBUG] Processing full lesson update')
    const { title, description, content, type, duration, previewable, videoId } = body
    
    // Get user ID from database
    const dbUser = await prisma.user.findUnique({
      where: { 
        clerkid: user.id 
      },
      select: {
        id: true
      }
    })
    
    if (!dbUser) {
      console.error('[ROUTE_DEBUG] Database user not found')
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    console.log(`[ROUTE_DEBUG] Database user found: ${dbUser.id}`)
    
    // Verify course exists and belongs to the user
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        userId: dbUser.id
      }
    })
    
    if (!course) {
      console.error('[ROUTE_DEBUG] Course not found or access denied')
      return NextResponse.json(
        { error: "Course not found or access denied" },
        { status: 404 }
      )
    }
    
    console.log(`[ROUTE_DEBUG] Course found: ${course.id}, ${course.title}`)
    
    // Verify lesson exists and belongs to the course
    const existingLesson = await prisma.lesson.findUnique({
      where: {
        id: lessonId,
        courseId
      }
    })
    
    if (!existingLesson) {
      console.error('[ROUTE_DEBUG] Lesson not found')
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      )
    }
    
    console.log(`[ROUTE_DEBUG] Lesson found: ${existingLesson.id}, ${existingLesson.title}`)
    
    // If we have quiz questions in body but not in the update data, log it
    if (body.questions && !body.questions.includes('"questions"')) {
      console.log('[ROUTE_DEBUG] WARNING: Quiz questions found in body but may not be included in update data')
    }
    
    // Update the lesson
    console.log('[ROUTE_DEBUG] Updating lesson with data:', {
      title, 
      description, 
      type, 
      previewable,
      updatingContent: !!content,
      updatingVideo: !!videoId
    })
    
    // Log extra debug information for questions data
    if (body.questions) {
      console.log('[ROUTE_DEBUG] Quiz questions will be updated')
      try {
        // Create data with everything we want to update
        const updateData = {
          title,
          description,
          content,
          type,
          duration,
          previewable,
          videoId,
          // Ensure questions is stored as a string
          questions: typeof body.questions === 'string' ? body.questions : JSON.stringify(body.questions),
          // Make sure passingScore and timeLimit are numbers
          passingScore: body.passingScore ? parseInt(body.passingScore) : undefined,
          timeLimit: body.timeLimit ? parseInt(body.timeLimit) : undefined
        }
        
        console.log('[ROUTE_DEBUG] Full update data keys:', Object.keys(updateData))
        console.log('[ROUTE_DEBUG] passingScore:', updateData.passingScore)
        console.log('[ROUTE_DEBUG] timeLimit:', updateData.timeLimit)
        
        // Update with all data
        const lesson = await prisma.lesson.update({
          where: {
            id: lessonId
          },
          data: updateData
        })
        
        console.log('[ROUTE_DEBUG] Lesson successfully updated')
        console.log('[ROUTE_DEBUG] Updated lesson data keys:', Object.keys(lesson))
        
        // Check if questions were saved properly
        if (lesson.questions) {
          console.log('[ROUTE_DEBUG] Questions saved successfully, type:', typeof lesson.questions)
          
          // Try to parse saved questions
          try {
            if (typeof lesson.questions === 'string') {
              const savedQuestions = JSON.parse(lesson.questions);
              console.log('[ROUTE_DEBUG] Parsed saved questions count:', 
                Array.isArray(savedQuestions) ? savedQuestions.length : 'not an array')
              
              // Check if these are sample questions
              if (Array.isArray(savedQuestions) && savedQuestions.length > 0) {
                const isSample = savedQuestions.some(q => 
                  q.id?.includes('sample') || 
                  q.text?.includes('Sample') ||
                  q.text?.includes('[SAMPLE]')
                )
                console.log('[ROUTE_DEBUG] Contains sample questions?', isSample)
              }
            }
          } catch (err) {
            console.error('[ROUTE_DEBUG] Error parsing saved questions:', err)
          }
        } else {
          console.error('[ROUTE_DEBUG] No questions field in updated lesson')
        }
        
        return NextResponse.json(
          { 
            status: 200,
            data: lesson
          },
          { status: 200 }
        )
      } catch (dbError) {
        console.error('[ROUTE_DEBUG] Database error during update:', dbError)
        throw dbError
      }
    } else {
      // Handle standard (non-quiz) update
      const lesson = await prisma.lesson.update({
        where: {
          id: lessonId
        },
        data: {
          title,
          description,
          content,
          type,
          duration,
          previewable,
          videoId
        }
      })
      
      console.log('[ROUTE_DEBUG] Standard lesson updated successfully')
      
      return NextResponse.json(
        { 
          status: 200,
          data: lesson
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error("[ROUTE_DEBUG] Critical error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { courseId: string, lessonId: string } }
) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const { courseId, lessonId } = params
    
    // Get user ID from database
    const dbUser = await prisma.user.findUnique({
      where: { 
        clerkid: user.id 
      },
      select: {
        id: true
      }
    })
    
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    // Verify course exists and belongs to the user
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        userId: dbUser.id
      }
    })
    
    if (!course) {
      return NextResponse.json(
        { error: "Course not found or access denied" },
        { status: 404 }
      )
    }
    
    // Verify lesson exists and belongs to the course
    const existingLesson = await prisma.lesson.findUnique({
      where: {
        id: lessonId,
        courseId
      }
    })
    
    if (!existingLesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      )
    }
    
    // Delete the lesson
    await prisma.lesson.delete({
      where: {
        id: lessonId
      }
    })
    
    return NextResponse.json(
      { 
        status: 200,
        message: "Lesson deleted successfully"
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting lesson:", error)
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 }
    )
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string, lessonId: string } }
) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const { courseId, lessonId } = params
    
    // Verify lesson exists and belongs to the course
    const lesson = await prisma.lesson.findUnique({
      where: {
        id: lessonId,
        courseId
      },
      include: {
        video: true
      }
    })
    
    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { 
        status: 200,
        data: lesson
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching lesson:", error)
    return NextResponse.json(
      { error: "Failed to fetch lesson" },
      { status: 500 }
    )
  }
} 