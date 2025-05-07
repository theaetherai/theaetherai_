import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { client } from "../../../../lib/prisma"; // Use the shared client instance

// ----- Separate all the heavy logic into isolated functions to prevent circular dependencies -----

// Initialize OpenAI in a separate function to avoid potential circular dependencies
function getOpenAIClient() {
  const openaiApiKey = process.env.OPEN_AI_KEY;
  
  
  return new OpenAI({
    apiKey: openaiApiKey,
    baseURL:  'https://api.groq.com/openai/v1' ,
  });
}

// Get the appropriate model in a separate function
function getAIModel() {
  return "qwen-qwq-32b";
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
    // Check for required env vars
    if (!process.env.OPEN_AI_KEY) {
      console.error("OPEN_AI_KEY is not set");
      return NextResponse.json({ error: "OPEN_AI_KEY is not set" }, { status: 500 });
    }

    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user;
    try {
      user = await currentUser();
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 401 });
      }
    } catch (clerkError) {
      console.error("Clerk Error:", clerkError);
      return NextResponse.json({ error: "Auth error" }, { status: 500 });
    }

    let body;
    try {
      body = await req.json();
    } catch (err) {
      console.error("Failed to parse JSON body:", err);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { prompt, context = "general", instructions, rubric } = body;
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    let response = "";
    try {
      const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });
      // Build system prompt as before
      const systemPrompt = buildSystemPrompt(context, instructions, rubric);
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });
      response = chatCompletion.choices[0].message.content || '';
    } catch (aiError) {
      console.error("AI Error:", aiError);
      return NextResponse.json({ error: "AI processing error" }, { status: 502 });
    }

    try {
      await client.aiTutorInteraction.create({
        data: {
          userId: user.id,
          prompt: prompt.substring(0, 1000),
          response: response.substring(0, 1000),
          context: context || 'general',
        }
      });
    } catch (dbError) {
      console.error("DB Error:", dbError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Server Error in /api/ai/tutor:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 