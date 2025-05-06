import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { currentUser } from "@clerk/nextjs/server"

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string, sectionId: string } }
) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const { courseId, sectionId } = params
    
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
    
    // Verify section exists and belongs to the course
    const section = await prisma.section.findUnique({
      where: {
        id: sectionId,
        courseId
      }
    })
    
    if (!section) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      )
    }
    
    const { title, type, order, previewable, content, videoId, duration, description } = await req.json()
    
    // Create a new lesson
    const lesson = await prisma.lesson.create({
      data: {
        title,
        type,
        order,
        previewable,
        content,
        videoId,
        duration,
        description,
        sectionId,
        courseId
      }
    })
    
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

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string, sectionId: string } }
) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const { courseId, sectionId } = params
    
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
    
    // Get lessons for the section
    const lessons = await prisma.lesson.findMany({
      where: {
        sectionId,
        courseId
      },
      orderBy: {
        order: "asc"
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