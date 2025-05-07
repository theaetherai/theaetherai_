import { NextResponse } from "next/server"

function isValidUUID(uuid: string | undefined) {
  return typeof uuid === 'string' && /^[0-9a-fA-F-]{36}$/.test(uuid)
}

// Minimal test route for PATCH
export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string, lessonId: string } }
) {
  const { courseId, lessonId } = params
  console.log(`Lesson PATCH endpoint hit ✅ courseId=${courseId}, lessonId=${lessonId}`)
  
  try {
    if (!isValidUUID(courseId) || !isValidUUID(lessonId)) {
      return NextResponse.json(
        { error: `Invalid courseId or lessonId: courseId='${courseId}', lessonId='${lessonId}'` },
        { status: 400 }
      )
    }
    
    // Return a test response without accessing any external services
    return NextResponse.json({ 
      status: 200, 
      message: "This is a test response from the lesson PATCH endpoint",
      courseId,
      lessonId
    })
  } catch (error) {
    console.error('Error in minimal test route:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Minimal test route for DELETE
export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string, lessonId: string } }
) {
  const { courseId, lessonId } = params
  console.log(`Lesson DELETE endpoint hit ✅ courseId=${courseId}, lessonId=${lessonId}`)
  
  try {
    if (!isValidUUID(courseId) || !isValidUUID(lessonId)) {
      return NextResponse.json(
        { error: `Invalid courseId or lessonId: courseId='${courseId}', lessonId='${lessonId}'` },
        { status: 400 }
      )
    }
    
    // Return a test response without accessing any external services
    return NextResponse.json({ 
      status: 200, 
      message: "This is a test response from the lesson DELETE endpoint",
      courseId,
      lessonId
    })
  } catch (error) {
    console.error('Error in minimal test route:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Minimal test route for GET
export async function GET(
  req: Request,
  { params }: { params: { courseId: string, lessonId: string } }
) {
  const { courseId, lessonId } = params
  console.log(`Lesson GET endpoint hit ✅ courseId=${courseId}, lessonId=${lessonId}`)
  
  try {
    if (!isValidUUID(courseId) || !isValidUUID(lessonId)) {
      return NextResponse.json(
        { error: `Invalid courseId or lessonId: courseId='${courseId}', lessonId='${lessonId}'` },
        { status: 400 }
      )
    }
    
    // Return a test response without accessing any external services
    return NextResponse.json({ 
      status: 200, 
      message: "This is a test response from the lesson GET endpoint",
      courseId,
      lessonId
    })
  } catch (error) {
    console.error('Error in minimal test route:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
} 