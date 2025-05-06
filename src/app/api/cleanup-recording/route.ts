import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      body = {};
    }

    const { recordingId, filename, userId, workspaceId } = body;

    // Log the cleanup completion
    console.log(`Alternative cleanup endpoint called for:`, {
      recordingId,
      filename,
      userId,
      workspaceId
    });

    // Very simple response with no dependencies
    return NextResponse.json(
      { success: true, message: 'Cleanup acknowledged via alternative endpoint' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in alternative cleanup endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 