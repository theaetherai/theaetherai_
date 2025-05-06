import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { client } from './prisma';
import { OpenAI } from 'openai';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Setup options - with fallback to in-memory processing if Redis isn't configured
const useRedis = process.env.REDIS_URL ? true : false;
let redisConnection: Redis | null = null;
let videoQueue: Queue | null = null;

// Initialize Redis and Queue if Redis URL is provided
if (useRedis) {
  try {
    redisConnection = new Redis(process.env.REDIS_URL as string);
    videoQueue = new Queue('video-processing', { 
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000 // 10 seconds
        }
      }
    });
    console.log('Video processing queue initialized with Redis');
  } catch (error) {
    console.error('Failed to initialize Redis connection:', error);
  }
}

// Interface for queue job data
interface ProcessingJob {
  videoId: string;
  url: string;
  userId?: string;
  timestamp?: number;
}

// Use the same OpenAI configuration as in other parts of the app
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
  baseURL: 'https://api.groq.com/openai/v1', // using Groq's API endpoint
});

/**
 * Add video to processing queue
 * Falls back to immediate processing if Redis isn't available
 */
export async function addToProcessingQueue(job: ProcessingJob): Promise<{success: boolean}> {
  if (videoQueue && redisConnection) {
    // Use BullMQ if Redis is available
    await videoQueue.add('process-video', {
      ...job,
      timestamp: job.timestamp || Date.now()
    });
    
    console.log(`Added video ${job.videoId} to processing queue`);
    return { success: true };
  } else {
    // Fallback to immediate "processing" without actual transcription
    console.log(`No queue available, marking video ${job.videoId} as processed immediately`);
    
    // Just mark as processed in the database
    try {
      await client.video.update({
        where: { id: job.videoId },
        data: {
          processing: false,
          description: "Processing completed (no transcription available - Redis not configured)",
          summery: "Transcript processing not available (Redis not configured)"
        }
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating video status:', error);
      throw error;
    }
  }
}

/**
 * Check the status of a processing job
 */
export async function checkProcessingStatus(videoId: string): Promise<{
  status: string;
  progress?: number;
  error?: string;
}> {
  try {
    const video = await client.video.findUnique({
      where: { id: videoId },
      select: {
        processing: true,
        description: true
      }
    });
    
    if (!video) {
      return { status: 'NOT_FOUND' };
    }
    
    // Extract status from description if it contains status info
    let status = video.processing ? 'PROCESSING' : 'COMPLETED';
    let error = undefined;
    
    if (video.description) {
      if (video.description.includes('DOWNLOADING')) {
        status = 'DOWNLOADING';
      } else if (video.description.includes('TRANSCRIBING')) {
        status = 'TRANSCRIBING';
      } else if (video.description.includes('SUMMARIZING')) {
        status = 'SUMMARIZING';
      } else if (video.description.includes('FAILED')) {
        status = 'FAILED';
        // Try to extract error message
        const errorMatch = video.description.match(/Failed: (.+)/);
        if (errorMatch && errorMatch[1]) {
          error = errorMatch[1];
        }
      }
    }
    
    return { status, error };
  } catch (error) {
    console.error('Error checking video status:', error);
    return { status: 'ERROR', error: String(error) };
  }
}

/**
 * Process a video directly without making API calls
 * This function should be called in a way that allows it to run in the background
 */
export async function processVideo(videoId: string, url: string, userId?: string): Promise<void> {
  const tempDir = path.join(os.tmpdir(), 'opal_video_processing');
  
  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const videoPath = path.join(tempDir, `video_${Date.now()}.mp4`);
  
  try {
    // Update video status to processing in database
    await client.video.update({
      where: { id: videoId },
      data: { 
        processing: true,
        description: "[STATUS: DOWNLOADING] Video download in progress..." 
      }
    });

    // Download video
    console.log(`Downloading video from ${url}`);
    await downloadVideo(url, videoPath);
    console.log(`Video downloaded to ${videoPath}`);
    
    // Process video
    let transcript = '';
    let summary = '';
    let title = '';
    
    // Update status
    await client.video.update({
      where: { id: videoId },
      data: { description: "[STATUS: TRANSCRIBING] Creating transcript..." }
    });
    
    // Check if OpenAI API is configured
    if (process.env.OPEN_AI_KEY) {
      try {
        // Generate transcript directly from video file
        transcript = await generateTranscript(videoPath);
        
        // Update status
        await client.video.update({
          where: { id: videoId },
          data: { description: "[STATUS: SUMMARIZING] Creating summary..." }
        });
        
        // Generate summary
        summary = await generateSummary(transcript);
        
        // Try to extract title from the summary
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
        await client.video.update({
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
    await client.video.update({
      where: { id: videoId },
      data: {
        processing: false,
        description: summary,
        summery: transcript,
        title: title || undefined, // Only update title if we have one
        aiKeywords: keywords
      }
    });
    
    console.log(`Successfully processed video ${videoId}`);
  } catch (error: any) {
    console.error(`Error processing video ${videoId}:`, error);
    
    // Update error status in database
    await client.video.update({
      where: { id: videoId },
      data: {
        processing: false,
        description: `[STATUS: FAILED] Processing failed: ${error.message}`
      }
    }).catch(err => {
      console.error('Error updating video error status:', err);
    });
    
    throw error;
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

// Generate transcript using OpenAI Whisper API directly from video file
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