import { client } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { id } = params
    
    console.log(`Processing video for user ID: ${id}, filename: ${body.filename}`);

    if (!body.filename) {
      return NextResponse.json(
        { status: 400, message: "Missing filename in request" },
        { status: 400 }
      );
    }
    
    // The ID is now the database UUID, so we can use it directly
    try {
      // Create the video record
      const video = await client.video.create({
        data: {
          title: body.filename,
          source: body.filename,
          description: "Screen recording",
          processing: true,
          User: {
            connect: { id: id }
          },
          WorkSpace: {
            connect: { id: body.workspaceId }
          }
        },
      });
      
      // Return success with optional plan info
      return NextResponse.json({
        status: 200,
        id: video.id,
        message: "Video processing started",
        plan: "PRO" // You can extract this from the user record if needed
      });
    } catch (dbError: any) {
      console.error(`Database error: ${dbError.message}`);
      
      // If there's an error, still return "success" to allow the recording to continue
      // but indicate that there was a database issue
      return NextResponse.json({
        status: 200,
        _bypassedDbError: true,
        message: "Bypassed database error, continuing with recording"
      });
    }
  } catch (error) {
    console.error("General error in processing route:", error);
    return NextResponse.json(
      { status: 500, message: "Server error" },
      { status: 500 }
    );
  }
}
