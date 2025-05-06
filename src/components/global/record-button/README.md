# Opal Screen Recording Feature

This component implements screen recording functionality that integrates with the Opal Express server for video processing and cloud storage.

## Feature Overview

- Record screen, window or browser tab
- Capture system audio (optional)
- Capture microphone audio (optional)
- Stream recording chunks to server in real-time
- Process video on the server
- Upload to Cloudinary
- Generate transcripts and AI summaries (for PRO users)
- Save to user workspace

## Technical Architecture

1. **Frontend Components**
   - RecordButton.tsx - UI for the recording button
   - RecordModal.tsx - Configuration modal for recording options
   - useRecording.ts - Hook that handles recording logic and socket communication
   - index.tsx - Main container component

2. **Server Integration**
   - Connects to Opal Express server via WebSocket (Socket.IO)
   - Streams video chunks to server in real-time
   - Receives status updates and errors from server

3. **Video Processing Pipeline**
   - Frontend captures WebM video with VP9 codec
   - Server receives chunks and assembles complete video
   - Video is uploaded to Cloudinary
   - For PRO users, transcription and AI summaries are generated
   - Video metadata is stored in the user's workspace

## Configuration

Set the Express server URL in your environment variables:

```
# .env.local
NEXT_PUBLIC_EXPRESS_SERVER_URL=http://localhost:5000  # Development
NEXT_PUBLIC_EXPRESS_SERVER_URL=https://your-express-server.com  # Production
```

## Server Requirements

The Opal Express server must be running with:
- Socket.IO support
- Cloudinary configuration
- OpenAI API keys (for transcription)
- Proper CORS configuration
- Sufficient disk space for temporary video storage

## Socket Connection Handling

The recording feature uses persistent WebSocket connections to transmit video data. To ensure reliable operation:

1. The socket connection must remain active throughout the entire recording and processing cycle.
2. The client waits for the "upload-complete" event from the server before disconnecting.
3. A safety timeout of 2 minutes is implemented on the client side to disconnect if no completion event is received.
4. The server sends regular "keep-alive" messages to prevent connection timeouts.
5. If the socket disconnects unexpectedly during processing, the server keeps the upload active for 5 minutes to allow reconnection.

## Usage Example

```tsx
import RecordButtonContainer from '@/components/global/record-button';

const MyComponent = ({ workspaceId }) => {
  return (
    <div>
      <RecordButtonContainer workspaceId={workspaceId} />
    </div>
  );
};
```

## Troubleshooting

1. **Connection Issues**
   - Ensure the Express server is running
   - Check CORS settings on server
   - Verify WebSocket connection is allowed by network
   - Check for firewalls or proxies that might block WebSocket connections

2. **Recording Issues**
   - User must grant screen capture permissions
   - Audio capture requires appropriate permissions
   - Some browsers have limitations for screen+audio capture

3. **Processing Issues**
   - Ensure server has sufficient disk space
   - Check Cloudinary credentials
   - Large files may time out during upload
   
4. **Socket Disconnection Issues**
   - If videos are not being processed after recording stops, check server logs for disconnection errors
   - Ensure ping timeout in Socket.IO server configuration is set high enough (recommended: 5 minutes)
   - Verify the client doesn't disconnect the socket prematurely before processing completes
   - Check for network stability issues that might interrupt the connection 