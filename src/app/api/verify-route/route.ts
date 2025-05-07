import { NextResponse } from "next/server"

function isValidUUID(uuid: string | undefined) {
  return typeof uuid === 'string' && /^[0-9a-fA-F-]{36}$/.test(uuid)
}
export async function GET(req: Request) {
  console.log(API endpoint hit: GET /api/C:\Users\HP\Desktop\Mini_project\Aethemus\src\app\api\verify-route\route.ts)
  
  try {
    return NextResponse.json({ 
      status: 200, 
      message: "This is a test response from /api/C:\Users\HP\Desktop\Mini_project\Aethemus\src\app\api\verify-route\route.ts endpoint"
    })
  } catch (error) {
    console.error('Error in minimal test route:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
export async function POST(req: Request) {
  console.log(API endpoint hit: POST /api/C:\Users\HP\Desktop\Mini_project\Aethemus\src\app\api\verify-route\route.ts)
  
  try {
    return NextResponse.json({ 
      status: 201, 
      message: "This is a test response from /api/C:\Users\HP\Desktop\Mini_project\Aethemus\src\app\api\verify-route\route.ts endpoint",
      data: { id: "new-item", createdAt: new Date().toISOString() }
    })
  } catch (error) {
    console.error('Error in minimal test route:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

