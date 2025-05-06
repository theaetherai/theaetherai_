import { NextResponse } from 'next/server';
import { client } from '@/lib/prisma';
import { OpenAI } from 'openai';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Use the same OpenAI configuration as in other parts of the app
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
  baseURL: 'https://api.groq.com/openai/v1', // using Groq's API endpoint
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoId, url } = body;

    if (!videoId || !url) {
      return NextResponse.json(
        { error: 'Missing videoId or url parameter' },
        { status: 400 }
      );
    }

    console.log(`Starting direct processing for video ${videoId}`);

    // Update video status to processing
    await client.video.update({
      where: { id: videoId },
      data: { processing: true }
    });

    // Process in the background but return response immediately
    processVideo(videoId, url).catch(error => {
      console.error(`Error processing video ${videoId}:`, error);
      
      // Mark video as failed
      client.video.update({
        where: { id: videoId },
        data: {
          processing: false,
          description: `Processing failed: ${error.message}`
        }
      }).catch(err => {
        console.error('Error updating video status:', err);
      });
    });

    // Return immediate success response
    return NextResponse.json({
      status: 200,
      message: 'Video processing started'
    });
  } catch (error: any) {
    console.error('Error initiating video processing:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

// Video processing function that runs directly in Next.js
async function processVideo(videoId: string, url: string) {
  const tempDir = path.join(os.tmpdir(), 'opal_video_processing');
  
  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const videoPath = path.join(tempDir, `video_${Date.now()}.mp4`);
  
  try {
    // Download video
    console.log(`Downloading video from ${url}`);
    await downloadVideo(url, videoPath);
    console.log(`Video downloaded to ${videoPath}`);
    
    // Process video
    let transcript = '';
    let summary = '';
    
    // Check if OpenAI API is configured
    if (process.env.OPEN_AI_KEY) {
      try {
        // Generate transcript directly from video file
        transcript = await generateTranscript(videoPath);
        
        // Generate summary
        summary = await generateSummary(transcript);
      } catch (processingError: any) {
        console.error('Error during transcription or summary:', processingError);
        transcript = `Transcription failed: ${processingError.message}`;
        summary = 'Summary not available due to transcription failure';
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
        summery: transcript,
        description: summary,
        aiKeywords: keywords
      }
    });
    
    console.log(`Successfully processed video ${videoId}`);
  } catch (error) {
    console.error(`Error processing video ${videoId}:`, error);
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
      model: "whisper-1"
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
    const response = await openai.chat.completions.create({
      model: process.env.AI_TUTOR_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct',
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
    
    return response.choices[0].message.content || 'Summary generation failed';
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