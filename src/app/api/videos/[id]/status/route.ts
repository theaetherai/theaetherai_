import { client } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkProcessingStatus } from '@/lib/video-processing';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  if (!id) {
    return NextResponse.json(
      { error: 'Invalid video ID' },
      { status: 400 }
    );
  }
  
  try {
    // Get processing status info
    const processingInfo = await checkProcessingStatus(id);
    
    // Get the video details from the database
    const video = await client.video.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        source: true,
        description: true,
        processing: true,
        summery: true,
        createdAt: true,
        views: true,
        aiKeywords: true,
        User: {
          select: {
            id: true, 
            firstname: true,
            lastname: true
          }
        },
        WorkSpace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    
    // Combine database info with processing status
    return NextResponse.json({ 
      video,
      processingInfo
    });
  } catch (error: any) {
    console.error('Error fetching video status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 