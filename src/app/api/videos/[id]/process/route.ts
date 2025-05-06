import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { OpenAI } from 'openai';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Setup Redis connection if available
const useRedis = process.env.REDIS_URL ? true : false;
let redisConnection: Redis | null = null;
let videoQueue: Queue | null = null;

if (useRedis) {
  try {
    redisConnection = new Redis(process.env.REDIS_URL as string);
    videoQueue = new Queue('video-processing', { 
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000
        }
      }
    });
  } catch (error) {
    console.error('Failed to initialize Redis connection:', error);
  }
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
  baseURL: 'https://api.groq.com/openai/v1', // using Groq's API endpoint
});

// Create a database client
const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const videoId = params.id;
  
  try {
    const body = await request.json();
    const { url, userId } = body;

    if (!url) {
      return NextResponse.json(
        { status: 400, message: "Missing video URL" }, 
        { status: 400 }
      );
    }

    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true }
    });

    if (!video) {
      return NextResponse.json(
        { status: 404, message: "Video not found" },
        { status: 404 }
      );
    }

    // Process using queue if available, otherwise directly
    if (videoQueue && redisConnection) {
      await videoQueue.add('process-video', {
        videoId,
        url,
        userId,
        timestamp: Date.now()
      });
      
      return NextResponse.json({
        status: 200,
        message: "Video processing queued successfully"
      });
    } else {
      // Process immediately in the background without awaiting
      processVideo(videoId, url, userId).catch(error => {
        console.error(`Background processing error for video ${videoId}:`, error);
      });
      
      return NextResponse.json({
        status: 200,
        message: "Video processing initiated"
      });
    }
  } catch (error: any) {
    console.error("Error processing video:", error);
    return NextResponse.json(
      { status: 500, message: "Server error", details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Process a video directly
async function processVideo(videoId: string, url: string, userId?: string): Promise<void> {
  const tempDir = path.join(os.tmpdir(), 'opal_video_processing');
  
  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const videoPath = path.join(tempDir, `video_${Date.now()}.mp4`);
  
  try {
    // Update video status to processing in database
    await prisma.video.update({
      where: { id: videoId },
      data: { 
        processing: true,
        description: "[STATUS: DOWNLOADING] Video download in progress..." 
      }
    });

    // Download video
    await downloadVideo(url, videoPath);
    
    // Process video
    let transcript = '';
    let summary = '';
    let title = '';
    
    // Update status
    await prisma.video.update({
      where: { id: videoId },
      data: { description: "[STATUS: TRANSCRIBING] Creating transcript..." }
    });
    
    // Check if OpenAI API is configured
    if (process.env.OPEN_AI_KEY) {
      try {
        // Generate transcript directly from video file
        transcript = await generateTranscript(videoPath);
        
        // Update status
        await prisma.video.update({
          where: { id: videoId },
          data: { description: "[STATUS: SUMMARIZING] Creating summary..." }
        });
        
        // Generate summary
        summary = await generateSummary(transcript);
        
        // Extract title from the summary
        try {
          // Look for a title in markdown format (# Title)
          const titleMatch = summary.match(/# ([^\n]+)/);
          if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].trim();
          }
        } catch (titleError) {
          console.error('Error extracting title:', titleError);
        }
      } catch (processingError: any) {
        console.error('Error during transcription or summary:', processingError);
        transcript = `Transcription failed: ${processingError.message}`;
        summary = 'Summary not available due to transcription failure';
        
        // Update error in database
        await prisma.video.update({
          where: { id: videoId },
          data: { 
            description: `[STATUS: FAILED] Processing failed: ${processingError.message}`
          }
        });
      }
    } else {
      transcript = 'Transcription not available (OpenAI API key not configured)';
      summary = 'Summary not available (OpenAI API key not configured)';
    }
    
    // Extract keywords
    const keywords = extractKeywords(transcript);
    
    // Update video with results
    await prisma.video.update({
      where: { id: videoId },
      data: {
        processing: false,
        description: summary,
        summery: transcript,
        title: title || undefined, // Only update title if we have one
        aiKeywords: keywords
      }
    });
  } catch (error: any) {
    console.error(`Error processing video ${videoId}:`, error);
    
    // Update error status in database
    await prisma.video.update({
      where: { id: videoId },
      data: {
        processing: false,
        description: `[STATUS: FAILED] Processing failed: ${error.message}`
      }
    }).catch(err => {
      console.error('Error updating video error status:', err);
    });
  } finally {
    // Clean up temporary files
    try {
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temporary files:', cleanupError);
    }
  }
}

// Download video to local filesystem
async function downloadVideo(url: string, outputPath: string): Promise<void> {
  const writer = fs.createWriteStream(outputPath);
  
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });
  
  response.data.pipe(writer);
  
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

// Generate transcript using OpenAI
async function generateTranscript(videoPath: string): Promise<string> {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(videoPath),
      model: "whisper-large-v3"
    });
    
    return transcription.text;
  } catch (error: any) {
    console.error('Error transcribing video:', error);
    throw new Error(`Failed to transcribe video: ${error.message}`);
  }
}

// Generate summary using OpenAI
async function generateSummary(transcript: string): Promise<string> {
  if (!transcript || transcript.length < 10) {
    return transcript ? 'Text too short to summarize' : 'No transcript available';
  }
  
  try {
    // Generate title and summary in JSON format
    const titleAndSummary = await openai.chat.completions.create({
      model: process.env.AI_TUTOR_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are going to generate a title and a nice description using the speech to text transcription provided: transcription(${transcript})  
          and then return it in json format as {"title":<the title you gave>,"summary":<the summary you created>}`,
        }
      ]
    });
    
    // Generate educational summary with structured format
    const educationalSummary = await openai.chat.completions.create({
      model: process.env.AI_TUTOR_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'system',
          content: `You are an educational content summarizer. Create a structured summary with key concepts, definitions, and important points that would help a student understand this material.
          
Format your response in a clear, organized structure:
1. Start with a brief overview of the content
2. Use sections with clear headings like "**Key Concepts:**", "**Important Definitions:**", "**Main Points:**", etc.
3. Use bullet points (with * symbol) for each item within a section
4. Provide a concise conclusion

DO NOT ask for more information or state that no transcript was provided. Work with the transcript provided, even if it seems incomplete.`,
        },
        {
          role: 'user',
          content: `Summarize this educational lecture transcript for a learning management system: ${transcript.substring(0, 4000)}`
        }
      ]
    });
    
    // Parse the title and summary JSON
    let titleSummaryObj = { title: '', summary: '' };
    try {
      titleSummaryObj = JSON.parse(titleAndSummary.choices[0].message.content || '{}');
    } catch (err) {
      console.error('Error parsing title/summary JSON:', err);
    }
    
    // Combine the results
    const combinedSummary = `
# ${titleSummaryObj.title || 'Untitled Video'}

${titleSummaryObj.summary || ''}

## Educational Summary

${educationalSummary.choices[0].message.content || 'No educational summary available.'}
`;
    
    return combinedSummary;
  } catch (error: any) {
    console.error("Error generating summary:", error);
    return "Summary generation failed: " + error.message;
  }
}

// Extract keywords from transcript (simple implementation)
function extractKeywords(transcript: string): string[] {
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
  const wordCounts: Record<string, number> = {};
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