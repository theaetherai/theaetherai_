import { client } from '@/lib/prisma'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    //WIRE UP AI AGENT
    const body = await req.json()
    const { id } = params
    
    console.log(`Transcribing for user ID: ${id}, filename: ${body.filename}`);

    const content = JSON.parse(body.content)

    // Store educational summary as part of description in JSON format if available
    let description = content.summary
    if (body.educationalSummary) {
      description = JSON.stringify({
        summary: content.summary,
        educationalSummary: body.educationalSummary
      })
    }
    
    // The ID is now the database UUID, so we can use it directly
    try {
      // Find the video by user ID and filename
      const video = await client.video.findFirst({
        where: {
          userId: id,
          source: { contains: body.filename }
        },
        select: {
          id: true
        }
      });
      
      if (!video) {
        console.error(`Video not found for transcription: ${body.filename}`);
        return NextResponse.json({ 
          status: 404, 
          message: "Video not found" 
        }, { status: 404 });
      }
      
      // Update the video with transcript and summary
      const updatedVideo = await client.video.update({
        where: {
          id: video.id,
        },
        data: {
          title: content.title,
          description: description,
          summery: body.transcript
        },
      });

      if (updatedVideo) {
        return NextResponse.json({ status: 200 });
      }

      return NextResponse.json(
        { status: 400, message: "Failed to update video with transcript" },
        { status: 400 }
      );
    } catch (error: any) {
      console.error(`Database error: ${error.message}`);
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
