import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Create direct database client instance
const prisma = new PrismaClient();

// GET: Check status of a video
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const videoId = params.id;
  
  try {
    // Use minimal query to avoid stack issues
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        processing: true,
        description: true,
      }
    });
    
    if (!video) {
      return NextResponse.json(
        { status: 404, message: "Video not found" },
        { status: 404 }
      );
    }
    
    // Extract status from description
    let status = video.processing ? 'PROCESSING' : 'COMPLETED';
    let progress = undefined;
    let error = undefined;
    
    if (video.description) {
      if (video.description.includes('DOWNLOADING')) {
        status = 'DOWNLOADING';
        progress = 25;
      } else if (video.description.includes('TRANSCRIBING')) {
        status = 'TRANSCRIBING';
        progress = 50;
      } else if (video.description.includes('SUMMARIZING')) {
        status = 'SUMMARIZING';
        progress = 75;
      } else if (video.description.includes('FAILED')) {
        status = 'FAILED';
        const errorMatch = video.description.match(/Failed: (.+)/);
        if (errorMatch && errorMatch[1]) {
          error = errorMatch[1];
        }
      }
    }
    
    return NextResponse.json({
      status,
      progress,
      error
    });
  } catch (error: any) {
    console.error('Error checking video status:', error);
    return NextResponse.json(
      { status: 'ERROR', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST: Start or update video processing
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const videoId = params.id;
  
  try {
    const { action, url, userId } = await request.json();
    
    if (action === 'start-processing' && url) {
      // Start background processing (lightweight logic only)
      await prisma.video.update({
        where: { id: videoId },
        data: {
          processing: true,
          description: "[STATUS: DOWNLOADING] Video processing scheduled"
        }
      });
      
      // Trigger background processing via a dynamic import
      // This approach prevents circular dependencies during build time
      // while still allowing the actual processing to happen at runtime
      try {
        // We use dynamic import here to prevent build-time circular dependencies
        import('../../../../../lib/video-worker').then(({ processVideoInBackground }) => {
          // Fire and forget - don't await
          processVideoInBackground(videoId, url).catch((err: Error) => {
            console.error(`Background processing error for video ${videoId}:`, err);
          });
        }).catch((err: Error) => {
          console.error('Failed to import video worker module:', err);
        });
        
        return NextResponse.json({
          status: 'PROCESSING',
          message: "Video processing initiated"
        });
      } catch (err: unknown) {
        console.error('Error scheduling processing:', err);
        // Continue with simpler approach as fallback
        
        // For this example, we'll just update with a placeholder
        setTimeout(async () => {
          try {
            await prisma.video.update({
              where: { id: videoId },
              data: {
                processing: false,
                description: "Video processing completed (simulation)",
                summery: "Video processing simulation completed. The worker module could not be loaded."
              }
            });
          } catch (err) {
            console.error('Error in delayed processing:', err);
          }
        }, 5000); // Simulate 5 second processing
        
        return NextResponse.json({
          status: 'PROCESSING',
          message: "Video processing initiated (simplified)"
        });
      }
    } else {
      return NextResponse.json(
        { status: 400, message: "Invalid action or missing URL" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error processing video:', error);
    return NextResponse.json(
      { status: 'ERROR', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 