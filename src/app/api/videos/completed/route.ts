import { client } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { processVideo } from '@/lib/video-processing'; // We'll create this helper function

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

    // Resolve user ID - find real user or use anonymous
    let effectiveUserId = userId;
    
    if (userId && userId !== 'anonymous') {
      try {
        // Try to find the user by database ID first
        const user = await client.user.findUnique({
          where: { id: userId },
          select: { id: true }
        });
        
        if (user) {
          effectiveUserId = user.id;
        } else if (userId.startsWith('user_')) {
          // Try by clerkId if it looks like a Clerk ID
          const userByClerk = await client.user.findUnique({
            where: { clerkid: userId },
            select: { id: true }
          });
          
          if (userByClerk) {
            effectiveUserId = userByClerk.id;
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
    
    // Create video entry - using the FULL URL as source
    const videoData: any = {
      title,
      source: url, // Store the full Cloudinary public URL
      description: "Video upload via Cloudinary",
      processing: true,
    };
    
    // Add user connection if we have a valid user ID
    if (effectiveUserId && effectiveUserId !== 'anonymous') {
      videoData.User = {
        connect: { id: effectiveUserId }
      };
    }
    
    // Add workspace if provided and valid
    if (workspaceId) {
      try {
        // Verify workspace exists
        const workspace = await client.workSpace.findUnique({
          where: { id: workspaceId },
          select: { id: true }
        });
        
        if (workspace) {
          videoData.WorkSpace = {
            connect: { id: workspaceId }
          };
        }
      } catch (err) {
        console.error('Error connecting to workspace:', err);
      }
    }
    
    // Create the video record
    const video = await client.video.create({
      data: videoData
    });

    // Start video processing in background
    try {
      // Call the processVideo function directly instead of using axios
      // This runs the processing in the background without waiting for it to complete
      processVideo(video.id, url, effectiveUserId).catch(error => {
        console.error(`Background processing error for video ${video.id}:`, error);
      });
      
      console.log('Video processing initiated for:', video.id);
    } catch (processingError) {
      console.warn('Failed to initiate processing:', processingError);
      // Continue anyway - the video is saved in the database
    }

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
  }
} 