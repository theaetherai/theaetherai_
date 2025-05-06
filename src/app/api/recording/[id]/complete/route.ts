import { client } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { id } = params
    
    console.log(`Processing complete request for user ID: ${id}, filename: ${body.filename}`);
    
    // The ID is now the database UUID, so we can use it directly
    try {
      // Find the video by user ID and filename
      const video = await client.video.findFirst({
        where: {
          userId: id,
          source: body.filename
        },
        select: {
          id: true
        }
      });
      
      if (!video) {
        console.error(`Video not found with filename: ${body.filename}`);
        return NextResponse.json({ 
          status: 404, 
          message: "Video not found" 
        }, { status: 404 });
      }
      
      // Update using the video's ID which is safe
      const completeProcessing = await client.video.update({
        where: {
          id: video.id
        },
        data: {
          processing: false,
          ...(body.url && { source: body.url })
        },
      });

      if (completeProcessing) {
        return NextResponse.json({ status: 200 });
      }

      return NextResponse.json(
        { status: 400, message: "Failed to mark processing as complete" },
        { status: 400 }
      );

    } catch (error: any) {
      console.error(`Database error: ${error.message}`);
      
      // If there's an error, but we have a URL, still return "success"
      // to indicate partial completion
      if (body.url) {
        return NextResponse.json({
          status: 200,
          partialSuccess: true,
          message: "Database update failed but URL is available",
          url: body.url
        });
      }
      
      return NextResponse.json(
        { status: 500, message: error.message || "Database error" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error(`General error: ${error.message}`);
    return NextResponse.json(
      { status: 500, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
