import { NextResponse } from "next/server"

function isValidUUID(uuid: string | undefined) {
  return typeof uuid === 'string' && /^[0-9a-fA-F-]{36}$/.test(uuid)
}
export async function GET(req: Request) {
  console.log(API endpoint hit: GET C:\Users\HP\Desktop\Mini_project\Aethemus\src\app\api\payment\route.ts)
  
  try {
    return NextResponse.json({ 
      status: 200, 
      message: "This is a test response from C:\Users\HP\Desktop\Mini_project\Aethemus\src\app\api\payment\route.ts"
    })
  } catch (error) {
    console.error('Error in minimal test route:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

