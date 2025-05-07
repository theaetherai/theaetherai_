import { NextResponse } from 'next/server'

// Minimal test route to debug build issues
export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  console.log('Course enrollment endpoint hit ✅')

  try {
    // Return a test response without accessing any external services
    return NextResponse.json({ 
      status: 201, 
      message: "This is a test response from the course enrollment endpoint",
      courseId: params.courseId
    })
  } catch (error) {
    console.error('Error in minimal test route:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Minimal test route for DELETE
export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  console.log('Course unenrollment endpoint hit ✅')

  try {
    // Return a test response without accessing any external services
    return NextResponse.json({ 
      status: 200, 
      message: "This is a test response from the course unenrollment endpoint",
      courseId: params.courseId
    })
  } catch (error) {
    console.error('Error in minimal test route:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
} 