import { NextResponse } from "next/server"

function isValidUUID(uuid: string | undefined) {
  return typeof uuid === 'string' && /^[0-9a-fA-F-]{36}$/.test(uuid)
}

// Minimal test route for GET
export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  const { courseId } = params
  console.log(`Course lessons GET endpoint hit ✅ courseId=${courseId}`)
  
  try {
    if (!isValidUUID(courseId)) {
      return NextResponse.json(
        { error: `Invalid courseId: '${courseId}'` },
        { status: 400 }
      )
    }
    
    // Return a test response without accessing any external services
    return NextResponse.json({ 
      status: 200, 
      message: "This is a test response from the course lessons GET endpoint",
      courseId,
      data: [
        { id: "test-lesson-1", title: "Test Lesson 1" },
        { id: "test-lesson-2", title: "Test Lesson 2" }
      ]
    })
  } catch (error) {
    console.error('Error in minimal test route:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Minimal test route for POST
export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  const { courseId } = params
  console.log(`Course lessons POST endpoint hit ✅ courseId=${courseId}`)
  
  try {
    if (!isValidUUID(courseId)) {
      return NextResponse.json(
        { error: `Invalid courseId: '${courseId}'` },
        { status: 400 }
      )
    }
    
    // Return a test response without accessing any external services
    return NextResponse.json({ 
      status: 201, 
      message: "This is a test response from the course lessons POST endpoint",
      courseId,
      data: { 
        id: "new-test-lesson", 
        title: "New Test Lesson", 
        createdAt: new Date().toISOString() 
      }
    })
  } catch (error) {
    console.error('Error in minimal test route:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
} 