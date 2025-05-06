/**
 * Video Processing Worker
 * 
 * This is a separate process that handles processing videos
 * uploaded via Cloudinary.
 * 
 * To run this worker:
 * - Ensure Redis is running and configured
 * - Run with: node workers/video-processor.js
 */

const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { PrismaClient } = require('@prisma/client');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');

// Initialize clients
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Initialize OpenAI if API key is provided
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else {
  console.warn('No OpenAI API key provided, transcription will not be available');
}

// Ensure temp directory exists
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Create worker
const worker = new Worker('video-processing', async job => {
  console.log(`Processing video ${job.data.videoId}`);
  const { videoId, url, userId } = job.data;
  
  try {
    // Mark video as processing
    await prisma.video.update({
      where: { id: videoId },
      data: { 
        processing: true
      }
    });
    
    // Download video
    console.log(`Downloading video from ${url}`);
    const videoPath = await downloadVideo(url);
    console.log(`Video downloaded to ${videoPath}`);
    
    // Generate transcript
    let transcript = '';
    let summary = '';
    
    if (openai) {
      try {
        console.log('Generating transcript from video...');
        transcript = await generateTranscript(videoPath);
        
        console.log('Generating summary...');
        summary = await generateSummary(transcript);
      } catch (transcriptError) {
        console.error('Error generating transcript:', transcriptError);
        transcript = 'Transcription failed: ' + transcriptError.message;
        summary = 'Summary not available due to transcription failure';
      }
    } else {
      transcript = 'Transcription not available (OpenAI API key not configured)';
      summary = 'Summary not available (OpenAI API key not configured)';
    }
    
    // Extract keywords
    const keywords = extractKeywords(transcript || '');
    
    // Update video with transcript and summary
    await prisma.video.update({
      where: { id: videoId },
      data: {
        processing: false,
        summery: transcript,
        description: summary,
        aiKeywords: keywords
      }
    });
    
    // Clean up temporary files
    fs.unlinkSync(videoPath);
    
    console.log(`Successfully processed video ${videoId}`);
  } catch (error) {
    console.error(`Error processing video ${videoId}:`, error);
    
    // Update video to mark as failed
    await prisma.video.update({
      where: { id: videoId },
      data: {
        processing: false,
        description: `Processing failed: ${error.message}`,
      }
    });
  }
}, { 
  connection: redis,
  concurrency: 1, // Process one video at a time
  lockDuration: 300000, // 5 minutes lock
});

// Download video function
async function downloadVideo(url) {
  const videoPath = path.join(tempDir, `video_${Date.now()}.mp4`);
  
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });
    
    const writer = fs.createWriteStream(videoPath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(videoPath));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading video:', error);
    throw error;
  }
}

// Generate transcript using OpenAI Whisper
async function generateTranscript(videoPath) {
  if (!openai) {
    return 'OpenAI API not configured';
  }
  
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(videoPath),
      model: "whisper-1"
    });
    
    return transcription.text;
  } catch (error) {
    console.error('Error transcribing video:', error);
    throw new Error(`Failed to transcribe video: ${error.message}`);
  }
}

// Generate summary using OpenAI
async function generateSummary(transcript) {
  if (!openai || !transcript || transcript.length < 10) {
    return transcript ? 'Text too short to summarize' : 'No transcript available';
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: "qwen-qwq-32b",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes video transcripts concisely."
        },
        {
          role: "user",
          content: `Summarize this transcript in 3-5 sentences:\n\n${transcript.substring(0, 4000)}`
        }
      ],
      max_tokens: 200
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Summary generation failed";
  }
}

// Extract keywords from transcript
function extractKeywords(transcript) {
  if (!transcript || transcript.length < 10) {
    return ['no keywords available'];
  }
  
  // Simple keyword extraction - removes common words and extracts key terms
  const stopWords = ['the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'];
  
  const words = transcript
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word));
  
  // Count word frequencies
  const wordCounts = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  // Sort by frequency and take top 10
  const keywords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
  
  return keywords.length > 0 ? keywords : ['no keywords available'];
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Worker received SIGTERM signal');
  await worker.close();
  await redis.quit();
  await prisma.$disconnect();
  console.log('Worker shut down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Worker received SIGINT signal');
  await worker.close();
  await redis.quit();
  await prisma.$disconnect();
  console.log('Worker shut down gracefully');
  process.exit(0);
});

// Log startup
console.log('Video processing worker started'); 