# Cloudinary Direct Upload Implementation

This document explains how to set up and use the new Cloudinary direct upload system for the Opal application.

## Overview

The new implementation uses a more robust and efficient approach for video uploads:

1. Videos are uploaded directly from the client browser to Cloudinary
2. A webhook notifies our API when the upload is complete
3. The video is processed in the background using a worker queue

This approach has several advantages:
- Less server bandwidth usage (videos don't pass through our Express server)
- More reliable uploads, especially for large files
- Better resumability for interrupted uploads
- Clear separation of upload and processing steps

## Environment Variables Required

Add these to your `.env` file:

```
# Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Redis (for processing queue) - optional
REDIS_URL=redis://localhost:6379

# OpenAI API key (for transcription) - optional
OPENAI_API_KEY=your_openai_api_key
```

## Cloudinary Setup

1. **Create an Upload Preset:**
   - Log into Cloudinary dashboard
   - Go to Settings > Upload
   - Create a new upload preset named "video_uploads"
   - Set folder to "opal_videos"
   - Enable "Use filename or externally defined Public ID"
   - Set mode to "Signed"

2. **Set up a Notification URL (Webhook):**
   - In your Cloudinary dashboard, go to Settings > Notifications
   - Add a new notification URL: `https://your-domain.com/api/webhooks/cloudinary`
   - Select "Resource Type: Video" and "Event: Upload"

## Components

### 1. Client-Side Upload Component

Use the `CloudinaryVideoUploader` component for direct-to-Cloudinary uploads:

```tsx
import CloudinaryVideoUploader from '@/components/global/videos/CloudinaryVideoUploader';

// In your component
<CloudinaryVideoUploader
  userId={user.id}
  workspaceId={workspaceId}
  clerkId={user.clerkId}
  onUploadComplete={(videoId) => {
    console.log(`Video ${videoId} uploaded successfully`);
    // Redirect or update UI
  }}
/>
```

### 2. API Routes

The implementation adds these API routes:
- `/api/videos/get-upload-signature` - Generates signed upload parameters
- `/api/videos/completed` - Handles completed uploads
- `/api/videos/[id]/status` - Checks processing status

### 3. Background Processing (Optional)

For advanced processing like transcription and summarization:

1. Install Redis and make sure it's running
2. Configure the `REDIS_URL` environment variable
3. Run the worker process:

```bash
node workers/video-processor.js
```

## Fallback Mechanism

If Redis is not configured, the system will still work without background processing:
- Videos will be saved with the source URL from Cloudinary
- Transcription and summarization will not be available

## Common Issues

- **Upload size limits:** Cloudinary free tier limits uploads to 100MB
- **Redis connection errors:** Check that Redis is running and accessible
- **Transcription errors:** Requires a valid OpenAI API key and FFmpeg installed
- **Missing videos:** Check that the upload preset is configured correctly

## Integration with Existing Code

The old Socket.io-based uploader (`EnhancedVideoUploader.tsx`) is still available
but we recommend using the new `CloudinaryVideoUploader` component for all new features. 