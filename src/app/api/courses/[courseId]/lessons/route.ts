import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { currentUser } from "@clerk/nextjs/server"

// GET all lessons for a course
export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    console.log("GET lessons endpoint called")
    const user = await currentUser()
    console.log("Current user:", user ? "authenticated" : "not authenticated")
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const courseId = params.courseId
    
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
    
    // Verify course exists
    const course = await prisma.course.findUnique({
      where: {
        id: courseId
      }
    })
    
    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      )
    }
    
    // Check if user is owner or enrolled
    const isOwner = course.userId === dbUser.id
    
    if (!isOwner) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          courseId,
          userId: dbUser.id
        }
      })
      
      if (!enrollment) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        )
      }
    }
    
    // Get all lessons for the course
    const lessons = await prisma.lesson.findMany({
      where: {
        section: {
          courseId
        }
      },
      orderBy: {
        order: "asc"
      },
      include: {
        section: {
          select: {
            title: true,
            order: true
          }
        }
      }
    })
    
    return NextResponse.json(
      { 
        status: 200,
        data: lessons 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching lessons:", error)
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    )
  }
}

// POST - Create a new lesson
export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    console.log("POST lesson endpoint called")
    const user = await currentUser()
    console.log("Current user:", user ? "authenticated" : "not authenticated")
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const courseId = params.courseId
    console.log("Course ID:", courseId)
    
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
      console.log("Course not found or access denied")
      return NextResponse.json(
        { error: "Course not found or access denied" },
        { status: 404 }
      )
    }
    
    const body = await req.json()
    console.log("Request body:", body)
    const { 
      title, 
      content, 
      sectionId, 
      duration, 
      videoId, 
      type = "text", 
      previewable = false,
      questions,
      passingScore,
      timeLimit,
      rubric,
      dueDate,
      fileTypes,
      maxFileSize,
      maxFiles
    } = body
    
    // Get the highest order for the section
    const highestOrderLesson = await prisma.lesson.findFirst({
      where: {
        sectionId
      },
      orderBy: {
        order: "desc"
      },
      select: {
        order: true
      }
    })
    
    const newOrder = highestOrderLesson ? highestOrderLesson.order + 1 : 1
    console.log("New lesson order:", newOrder)
    
    // Create a new lesson with proper type handling
    const lessonData: any = {
        title,
        content,
        sectionId,
        duration,
        order: newOrder,
      previewable,
      type, // Use the type from the request
      courseId
    };

    // Add type-specific fields if they exist
    if (videoId) lessonData.videoId = videoId;
    
    // Add quiz-specific fields if this is a quiz
    if (type === "quiz") {
      if (questions) lessonData.questions = Array.isArray(questions) ? JSON.stringify(questions) : questions;
      if (passingScore) lessonData.passingScore = passingScore;
      if (timeLimit) lessonData.timeLimit = timeLimit;
    }
    
    // Add assignment-specific fields if this is an assignment
    if (type === "assignment") {
      if (rubric) lessonData.rubric = typeof rubric === 'string' ? rubric : JSON.stringify(rubric);
      if (dueDate) lessonData.dueDate = new Date(dueDate);
      if (fileTypes) lessonData.fileTypes = fileTypes;
      if (maxFileSize) lessonData.maxFileSize = maxFileSize;
      if (maxFiles) lessonData.maxFiles = maxFiles;
    }
    
    console.log("Creating lesson with data:", JSON.stringify(lessonData, null, 2));
    
    // Create the lesson with all relevant fields
    const lesson = await prisma.lesson.create({
      data: lessonData
    })
    
    console.log("Lesson created:", lesson.id, "with type:", lesson.type)
    return NextResponse.json(
      { 
        status: 201,
        data: lesson
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating lesson:", error)
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    )
  }
} 