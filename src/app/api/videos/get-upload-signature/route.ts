import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensure this isn't cached

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const workspaceId = searchParams.get('workspaceId');
  
  // Configure cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  });

  try {
    // Generate unique public_id
    const timestamp = new Date().getTime();
    const public_id = `video_${timestamp}_${userId || 'anonymous'}`;
    
    // Create context object - this needs to match what the frontend sends exactly
    const context = JSON.stringify({
      userId: userId || 'anonymous',
      workspaceId: workspaceId || '',
      source: 'opal-webprodigies',
      uploadedAt: new Date().toISOString()
    });
    
    // Create signature including the context
    const paramsToSign = {
      timestamp,
      public_id,
      folder: 'opal_videos',
      upload_preset: 'video_uploads',
      context // Include context in the signature calculation
    };
    
    console.log('Generating signature with params:', JSON.stringify(paramsToSign));
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      public_id,
      folder: 'opal_videos',
      context // Return context to the client
    });
  } catch (error: any) {
    console.error('Error generating signature:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload signature', details: error.message },
      { status: 500 }
    );
  }
} 