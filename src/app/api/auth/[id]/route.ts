import { NextResponse } from 'next/server'

// Minimal test route to debug build issues
export async function GET(
  req: Request,
  { params: { id } }: { params: { id: string } }
) {
  console.log('Auth [id] endpoint hit ✅')

  try {
    // Return a test response without accessing any external services
    return NextResponse.json({ 
      status: 200, 
      message: "This is a test response from the auth endpoint",
      userId: id
    })
  } catch (error) {
    console.error('Error in minimal test route:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
