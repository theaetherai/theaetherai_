import { client } from '../../../../../lib/prisma';
import { NextResponse } from 'next/server';

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
    // Super minimal query to avoid any potential circular references
    const video = await client.video.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        source: true,
        processing: true,
        createdAt: true
      }
    });
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    
    // Determine processing status directly
    const status = video.processing ? 'PROCESSING' : 'COMPLETED';
    
    // Return minimal information
    return NextResponse.json({ 
      video: {
        ...video,
        status
      }
    });
  } catch (error: any) {
    console.error('Error fetching video status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 