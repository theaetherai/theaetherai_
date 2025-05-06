import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

// ----- Separate all the heavy logic into isolated functions to prevent circular dependencies -----

// Create a minimal Prisma client - using the simplest possible approach
const prisma = new PrismaClient();

// Initialize OpenAI in a separate function to avoid potential circular dependencies
function getOpenAIClient() {
  const openaiApiKey = process.env.GROQ_API_KEY || process.env.OPEN_AI_KEY;
  const useGroq = !!process.env.GROQ_API_KEY;
  
  return new OpenAI({
    apiKey: openaiApiKey,
    baseURL: useGroq ? 'https://api.groq.com/openai/v1' : undefined,
  });
}

// Get the appropriate model in a separate function
function getAIModel() {
  const useGroq = !!process.env.GROQ_API_KEY;
  return useGroq ? "llama3-8b-8192" : "gpt-3.5-turbo";
}

// Build system prompt in a separate function to simplify the main handler
function buildSystemPrompt(context: string, instructions?: string, rubric?: any[]) {
  let systemPrompt = "You are an AI tutor for an online learning platform called Opal.";
  
  // Add context-specific instructions
  switch (context) {
    case "generate_quiz":
      systemPrompt += `
      You are generating a quiz based on video content. The transcript of the video is provided.
      
      Your task is to:
      1. Analyze the transcript and identify key concepts and information
      2. Create quiz questions that test understanding of the material
      3. Format your response as a valid JSON array that can be parsed
      
      Return ONLY valid JSON array matching this exact structure:
      [
        {
          "id": "q-1",
          "text": "Question text?",
          "type": "multipleChoice",
          "points": 1,
          "options": [
            {"id": "o-1-1", "text": "Option A", "isCorrect": false},
            {"id": "o-1-2", "text": "Option B", "isCorrect": true},
            {"id": "o-1-3", "text": "Option C", "isCorrect": false},
            {"id": "o-1-4", "text": "Option D", "isCorrect": false}
          ]
        }
      ]`;
      break;
      
    case "assignment_draft":
      systemPrompt += `
      You are helping a student with drafting an assignment response. The assignment instructions are:
      
      ${instructions || "No specific instructions provided"}
      
      Your task is to help the student by creating a draft based on their prompt.`;
      break;
      
    case "assignment_feedback":
      systemPrompt += `
      You are providing feedback on a student's work in progress for an assignment. 
      The assignment instructions are: ${instructions}`;
      
      if (rubric?.length) {
        systemPrompt += ` The assignment will be graded according to a rubric.`;
      }
      break;
      
    case "assignment_assessment":
      systemPrompt += `
      You are conducting a pre-submission assessment of a student's assignment.
      The assignment instructions are: ${instructions}`;
      break;
      
    case "quiz_help":
      systemPrompt += `
      You are helping a student understand a concept related to a quiz.`;
      break;
      
    case "generate_summary":
      systemPrompt += `
      You are an educational content summarizer. Create a structured summary with key concepts, definitions, and important points.`;
      break;
      
    default:
      systemPrompt += `
      You're helping the student learn and understand course materials.`;
  }
  
  return systemPrompt;
}

// Main API handler - kept as minimal as possible
export async function POST(req: Request) {
  try {
    // Get user information
    const user = await currentUser();
    if (!user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    // Parse request body with minimal error handling
    const { prompt, context = "general", instructions, rubric } = await req.json().catch(() => ({}));
    
    if (!prompt) {
      return new Response("Prompt is required", { status: 400 });
    }
    
    // Generate AI response with minimal logic
    try {
      // Get OpenAI client on demand
      const openai = getOpenAIClient();
      const model = getAIModel();
      
      // Build prompt in a separate function
      const systemPrompt = buildSystemPrompt(context, instructions, rubric);
      
      // Generate completion with minimal options
      const chatCompletion = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });
      
      const response = chatCompletion.choices[0].message.content || '';
      
      // Log interaction with minimal fields
      try {
        await prisma.aiTutorInteraction.create({
          data: {
            userId: user.id,
            prompt: prompt.substring(0, 1000), // Limit length to avoid issues
            response: response.substring(0, 1000), // Limit length to avoid issues
            context: context || 'general',
          }
        });
      } catch (dbError) {
        // Ignore logging errors
        console.error("DB Error:", dbError);
      }
      
      // Return response with minimal processing
      return NextResponse.json({ response });
      
    } catch (aiError: any) {
      // Handle AI errors with minimal processing
      return NextResponse.json({ 
        error: "AI processing error"
      }, { status: 502 });
    }
    
  } catch (error: any) {
    // Minimal error handling
    return NextResponse.json({ 
      error: "Server error"
    }, { status: 500 });
  } finally {
    // Always disconnect
    await prisma.$disconnect().catch(() => {});
  }
} 