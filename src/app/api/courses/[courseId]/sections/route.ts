import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { currentUser } from "@clerk/nextjs/server"

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser()
    
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
    
    // Get sections with lessons for the course
    const sections = await prisma.section.findMany({
      where: {
        courseId
      },
      include: {
        lessons: {
          orderBy: {
            order: "asc"
          }
        }
      },
      orderBy: {
        order: "asc"
      }
    })
    
    return NextResponse.json(
      sections,
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching course sections:", error)
    return NextResponse.json(
      { error: "Failed to fetch course sections" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser()
    
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
    
    const { title, order } = await req.json()
    
    if (!title) {
      return NextResponse.json(
        { error: "Section title is required" },
        { status: 400 }
      )
    }
    
    // Create a new section
    const section = await prisma.section.create({
      data: {
        title,
        order: order || 0,
        courseId
      }
    })
    
    return NextResponse.json(
      { 
        status: 201,
        data: {
          ...section,
          lessons: []
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating section:", error)
    return NextResponse.json(
      { error: "Failed to create section" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser()
    
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
    
    const { sections } = await req.json()
    
    // Update section orders in a transaction
    if (Array.isArray(sections)) {
      await prisma.$transaction(
        sections.map(section => 
          prisma.section.update({
            where: { id: section.id },
            data: { order: section.order }
          })
        )
      )
    }
    
    return NextResponse.json(
      { 
        status: 200,
        message: "Section order updated successfully"
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating section order:", error)
    return NextResponse.json(
      { error: "Failed to update section order" },
      { status: 500 }
    )
  }
} 