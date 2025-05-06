import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const recordingId = params.id;
    if (!recordingId) {
      return NextResponse.json(
        { error: 'Recording ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      body = {};
    }

    // Log the cleanup completion
    console.log(`Cleanup complete for recording: ${recordingId}`, body);

    // Very simple response with no database dependencies
    return NextResponse.json(
      { success: true, message: 'Cleanup acknowledged', recordingId },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in cleanup-complete endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 