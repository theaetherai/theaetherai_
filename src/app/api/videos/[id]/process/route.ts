import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Create a direct instance to avoid shared imports
const prisma = new PrismaClient();

// Simple response handler to avoid circular dependencies
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const videoId = params.id;
  
  try {
    const body = await request.json();
    const { url, userId } = body;

    if (!url) {
      return NextResponse.json(
        { status: 400, message: "Missing video URL" }, 
        { status: 400 }
      );
    }

    // Check if video exists with minimal query
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true }
    });

    if (!video) {
      return NextResponse.json(
        { status: 404, message: "Video not found" },
        { status: 404 }
      );
    }

    // Update video status directly, without nested logic
    await prisma.video.update({
      where: { id: videoId },
      data: { 
        processing: true,
        description: "Video processing scheduled"
      }
    });

    // Instead of directly processing, we'll send a message to ourselves
    // This breaks the synchronous call stack and avoids stack overflows
    try {
      // Create a lightweight background processing task
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
      
      // Use fetch in a non-awaited way to start background processing
      fetch(`${baseUrl}/api/videos/${videoId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'start-processing',
          url, 
          userId 
        })
      }).catch(err => {
        console.error('Failed to initiate background processing:', err);
      });
    } catch (err) {
      console.error('Error scheduling processing:', err);
      // Continue anyway, returning success
    }
    
    return NextResponse.json({
      status: 200,
      message: "Video processing initiated"
    });
  } catch (error: any) {
    console.error("Error processing video:", error);
    return NextResponse.json(
      { status: 500, message: "Server error", details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 