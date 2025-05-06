import { client } from '../../../../lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!userId) {
      return NextResponse.json(
        { status: 401, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    
    const video = await client.video.findUnique({
      where: { id },
      select: {
        title: true,
        summery: true,
        description: true,
        source: true,
      }
    })

    if (!video) {
      return NextResponse.json(
        { status: 404, error: 'Video not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      status: 200, 
      data: video 
    })
  } catch (error) {
    console.error('Error fetching video data:', error)
    return NextResponse.json(
      { status: 500, error: 'Failed to fetch video data' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!userId) {
      return NextResponse.json(
        { status: 401, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    
    // First check if the video exists and belongs to the user
    const existingVideo = await client.video.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        User: {
          select: {
            clerkid: true
          }
        }
      }
    })

    if (!existingVideo) {
      return NextResponse.json(
        { status: 404, error: 'Video not found' },
        { status: 404 }
      )
    }

    // Check if the user owns the video or has admin rights
    // This can be expanded based on your permissions model
    const isOwner = existingVideo.userId === user.id || 
                   existingVideo.User?.clerkid === user.id;
    
    if (!isOwner && user.publicMetadata.role !== 'admin') {
      return NextResponse.json(
        { status: 403, error: 'You do not have permission to delete this video' },
        { status: 403 }
      )
    }

    // Delete the video
    await client.video.delete({
      where: { id }
    })

    return NextResponse.json({ 
      status: 200, 
      message: 'Video deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json(
      { status: 500, error: 'Failed to delete video' },
      { status: 500 }
    )
  }
} 