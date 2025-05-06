import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { currentUser } from "@clerk/nextjs/server"

export async function PATCH(
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
    const existingSection = await prisma.section.findUnique({
      where: {
        id: sectionId,
        courseId
      }
    })
    
    if (!existingSection) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      )
    }
    
    const { title, description } = await req.json()
    
    // Update the section
    const section = await prisma.section.update({
      where: {
        id: sectionId
      },
      data: {
        title,
        description
      }
    })
    
    return NextResponse.json(
      { 
        status: 200,
        data: section
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating section:", error)
    return NextResponse.json(
      { error: "Failed to update section" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const existingSection = await prisma.section.findUnique({
      where: {
        id: sectionId,
        courseId
      }
    })
    
    if (!existingSection) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      )
    }
    
    // Delete the section (and all lessons due to cascading delete)
    await prisma.section.delete({
      where: {
        id: sectionId
      }
    })
    
    return NextResponse.json(
      { 
        status: 200,
        message: "Section deleted successfully"
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting section:", error)
    return NextResponse.json(
      { error: "Failed to delete section" },
      { status: 500 }
    )
  }
} 