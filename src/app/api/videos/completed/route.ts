import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Create a direct instance of PrismaClient to avoid potential circular imports
const prisma = new PrismaClient();

// Separate function to process video - no imports
async function triggerVideoProcessing(videoId: string, url: string, userId?: string) {
  try {
    // Instead of directly calling processVideo which might create circular dependencies,
    // we'll make an internal API call to trigger processing
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
      
    // Schedule processing via fetch instead of direct function call
    const response = await fetch(`${baseUrl}/api/videos/${videoId}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, userId }),
    });
    
    if (!response.ok) {
      console.warn(`Failed to schedule processing for video ${videoId}`);
    }
  } catch (processingError) {
    console.error(`Failed to trigger processing for ${videoId}:`, processingError);
    // Continue anyway - the video is saved in the database
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      videoId, 
      userId, 
      workspaceId, 
      url, // This is the secure_url from Cloudinary
      format,
      duration
    } = body;

    if (!url) {
      return NextResponse.json(
        { status: 400, message: "Missing video URL" },
        { status: 400 }
      );
    }

    // Resolve user ID with simplified query
    let effectiveUserId = userId;
    
    if (userId && userId !== 'anonymous') {
      try {
        // Simplified query - no nested selects
        if (userId.startsWith('user_')) {
          const userByClerk = await prisma.user.findUnique({
            where: { clerkid: userId },
            select: { id: true }
          });
          
          if (userByClerk) {
            effectiveUserId = userByClerk.id;
          }
        } else {
          // Check by database ID
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true }
          });
          
          if (user) {
            effectiveUserId = user.id;
          }
        }
      } catch (err) {
        console.error('Error finding user:', err);
        // Continue with original userId as fallback
      }
    }
    
    // Extract filename or use videoId as title
    const title = videoId.includes('/') 
      ? videoId.split('/').pop() 
      : `video_${videoId}`;
    
    // Prepare video data - simplified approach without nested objects
    let videoData: any = {
      title,
      source: url,
      description: "Video upload via Cloudinary",
      processing: true,
    };
    
    // Add user connection if we have a valid user ID
    if (effectiveUserId && effectiveUserId !== 'anonymous') {
      videoData.userId = effectiveUserId; // Direct assignment instead of nested connect
    }
    
    // Add workspace if provided and valid
    if (workspaceId) {
      try {
        // Simplified workspace verification
        const workspace = await prisma.workSpace.findUnique({
          where: { id: workspaceId },
          select: { id: true }
        });
        
        if (workspace) {
          videoData.workspaceId = workspaceId; // Direct assignment
        }
      } catch (err) {
        console.error('Error checking workspace:', err);
      }
    }
    
    // Create the video record with simplified query
    const video = await prisma.video.create({
      data: videoData
    });

    // Trigger video processing in background using the separate function
    triggerVideoProcessing(video.id, url, effectiveUserId);
    console.log('Video processing triggered for:', video.id);

    return NextResponse.json({
      status: 200,
      id: video.id,
      message: "Video upload completed successfully",
    });
  } catch (error: any) {
    console.error("Error in completed video upload route:", error);
    return NextResponse.json(
      { status: 500, message: "Server error", details: error.message },
      { status: 500 }
    );
  } finally {
    // Disconnect Prisma client to prevent connection leaks
    await prisma.$disconnect();
  }
} 