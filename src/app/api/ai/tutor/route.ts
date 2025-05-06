import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { client } from "../../../../lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
  baseURL: 'https://api.groq.com/openai/v1', // replace with actual Grok base URL
});

export async function POST(req: Request) {
  try {
    console.log("[AI_TUTOR_REQUEST] New request received");
    
    const { userId } = getAuth(req);
    
    if (!userId) {
      console.log("[AI_TUTOR_AUTH_ERROR] No authenticated user found");
      return new Response("Unauthorized", { status: 401 });
    }
    
    console.log(`[AI_TUTOR_AUTH] User authenticated: ${user.id}`);
    
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("[AI_TUTOR_REQUEST_PARSE_ERROR]", parseError);
      return new Response("Invalid JSON in request body", { status: 400 });
    }
    
    const { prompt, context, instructions, rubric } = requestBody;
    
    if (!prompt) {
      console.log("[AI_TUTOR_VALIDATION_ERROR] Missing prompt");
      return new Response("Prompt is required", { status: 400 });
    }
    
    console.log(`[AI_TUTOR_REQUEST_INFO] Context: ${context}, Prompt length: ${prompt.length}`);
    
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
        
        For each question:
        - Create either multiple choice (4 options) or true/false questions
        - Ensure there is only one correct answer per question
        - Assign a unique ID to each question and option
        - Focus on meaningful content
        
        NOTE: Some transcripts may be very short. In these cases:
        - Create simple questions based on the limited available content
        - If not enough content is available for meaningful questions, 
          create basic true/false questions about the general topic
        - Create as many questions as the content allows for (even if fewer than 5)
        
        FORMAT REQUIREMENTS:
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
        ]
        
        For true/false questions, only include two options with text "True" and "False".
        Do not include any explanatory text, just the JSON array.
        `;
        break;
        
      case "assignment_draft":
        systemPrompt += `
        You are helping a student with drafting an assignment response. The assignment instructions are:
        
        ${instructions || "No specific instructions provided"}
        
        Your task is to help the student by creating a draft based on their prompt. 
        DO NOT write a complete solution, but provide a helpful starting point with key ideas,
        structure, and some content they can build upon. Include placeholders where 
        they should add their own analysis or examples.
        
        Make your response focused, helpful, and educational. Format your response 
        in clear sections with headings where appropriate.
        `;
        break;
        
      case "assignment_feedback":
        systemPrompt += `
        You are providing feedback on a student's work in progress for an assignment. 
        The assignment instructions are:
        
        ${instructions}
        
        ${rubric?.length ? `The assignment will be graded according to this rubric:
        ${JSON.stringify(rubric, null, 2)}` : ''}
        
        Your task is to provide constructive feedback to help the student improve their work.
        Focus on:
        1. Strengths - what they've done well
        2. Areas for improvement - specific points they should revise
        3. Suggestions - concrete ways to enhance their work
        
        Be supportive, specific, and actionable in your feedback. Don't rewrite their work,
        but guide them toward improving it themselves.
        `;
        break;
        
      case "assignment_assessment":
        systemPrompt += `
        You are conducting a pre-submission assessment of a student's assignment.
        The assignment instructions are:
        
        ${instructions}
        
        ${rubric?.length ? `The assignment will be graded according to this rubric:
        ${JSON.stringify(rubric, null, 2)}` : ''}
        
        Evaluate the submission against each rubric criterion and provide a detailed assessment.
        For each criterion:
        1. Indicate the current performance level
        2. Highlight strengths and weaknesses
        3. Provide specific recommendations for improvement
        
        Also provide an overall assessment and estimated score based on the current state.
        Format your response with clear headings and structure.
        `;
        break;
        
      case "quiz_help":
        systemPrompt += `
        You are helping a student understand a concept related to a quiz. 
        Your task is to explain the concept in a way that helps them understand, 
        but do NOT provide direct answers to quiz questions.
        
        Instead, focus on explaining the underlying concepts, providing examples,
        and guiding their thinking process. Be educational and helpful while 
        maintaining academic integrity.
        `;
        break;
        
      case "generate_summary":
        systemPrompt += `
        You are an educational content summarizer. Create a structured summary with key concepts, definitions, and important points that would help a student understand this material.
          
        Format your response in a clear, organized structure:
        1. Start with a brief overview of the content IN FIRST PERSON (use "I", "me", "my")
        2. Use sections with clear headings like "**Key Concepts I've Identified:**", "**Important Definitions:**", "**Main Points I Want to Highlight:**", etc.
        3. Use bullet points (with * symbol) for each item within a section
        4. Provide a concise conclusion in first person, as if you're directly speaking to the student

        DO NOT ask for more information or state that no transcript was provided. Work with the transcript provided, even if it seems incomplete.
        
        Keep your summary concise - no more than 2-3 short paragraphs for the overview and 2-4 bullet points per section.
        
        IMPORTANT: Write in first person throughout, as if you (the AI tutor) are personally explaining the content to the student.
        For example: "In this video, I'll summarize the key points about..." or "I've identified these important concepts..."
        `;
        break;
        
      default:
        systemPrompt += `
        You're helping the student learn and understand course materials. Provide
        clear, concise, and educational responses to their questions. Use examples
        when helpful, and explain concepts in a way that promotes learning.
        `;
    }
    
    // Generate AI response
    console.log(`[AI_TUTOR_OPENAI_REQUEST] Sending request to OpenAI, model: qwen-qwq-32b`);
    let chatCompletion;
    try {
      chatCompletion = await openai.chat.completions.create({
        model: "qwen-qwq-32b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });
      console.log(`[AI_TUTOR_OPENAI_RESPONSE] Response received`);
    } catch (openaiError: any) {
      console.error("[AI_TUTOR_OPENAI_ERROR]", {
        error: openaiError.message,
        type: openaiError.type,
        code: openaiError.code,
        param: openaiError.param,
        status: openaiError.status
      });
      
      return NextResponse.json({ 
        error: `OpenAI API error: ${openaiError.message}`,
        code: openaiError.code || 'unknown_error',
      }, { status: 502 }); // Bad Gateway - upstream service failed
    }
    
    const aiResponse = chatCompletion.choices[0].message.content || '';
    
    // Clean the response to remove any thinking tags
    const cleanedResponse = aiResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    // Handle quiz generation specifically
    if (context === 'generate_quiz' && cleanedResponse) {
      try {
        console.log(`[AI_TUTOR_QUIZ_PROCESSING] Attempting to parse response as JSON`);
        console.log(`[AI_TUTOR_QUIZ_RESPONSE_PREVIEW] First 100 chars: ${cleanedResponse.substring(0, 100)}`);
        
        // Look for JSON arrays in the text
        let jsonContent = cleanedResponse;
        if (!jsonContent.trim().startsWith('[')) {
          console.log('[AI_TUTOR_CLEANUP] Response does not start with [, looking for JSON array');
          const jsonMatch = jsonContent.match(/\[([\s\S]*?)\]/);
          if (jsonMatch) {
            jsonContent = jsonMatch[0];
          }
        }
        
        console.log(`[AI_TUTOR_CLEANED_RESPONSE] Cleaned response: ${jsonContent.substring(0, 100)}`);
        
        // Try to parse the response as JSON
        const quizData = JSON.parse(jsonContent);
        
        // Validate quiz data structure
        if (!Array.isArray(quizData)) {
          console.error("[AI_TUTOR_QUIZ_VALIDATION_ERROR] Response is not an array");
          return NextResponse.json({ 
            error: "AI response is not a valid quiz array", 
            text: jsonContent 
          }, { status: 400 });
        }
        
        if (quizData.length === 0) {
          console.error("[AI_TUTOR_QUIZ_VALIDATION_ERROR] Quiz array is empty");
          return NextResponse.json({ 
            error: "AI generated an empty quiz", 
            text: jsonContent 
          }, { status: 400 });
        }
        
        // Add IDs and ensure correct structure for quiz data
        const processedQuizData = quizData.map((question: any, index: number) => {
          if (!question.id) {
            question.id = `q${index + 1}`;
          }
          
          // Ensure points field exists
          if (question.points === undefined) {
            question.points = 1;
          }
          
          // Process options if they exist
          if (Array.isArray(question.options)) {
            question.options = question.options.map((option: any, optIndex: number) => {
              if (!option.id) {
                option.id = `q${index + 1}-${String.fromCharCode(97 + optIndex)}`;
              }
              return option;
            });
          }
          
          return question;
        });
        
        console.log(`[AI_TUTOR_QUIZ_SUCCESS] Generated ${processedQuizData.length} questions`);
        
        // Return the processed quiz data
        return NextResponse.json({ 
          quiz: processedQuizData
        }, { status: 200 });
      } catch (jsonError) {
        console.error("[AI_TUTOR_QUIZ_JSON_PARSE_ERROR]", jsonError);
        console.error("[AI_TUTOR_QUIZ_JSON_PARSE_ERROR_RESPONSE]", cleanedResponse);
        
        // Generate a basic fallback quiz from the model's response
        try {
          console.log("[AI_TUTOR_FALLBACK] Generating basic fallback quiz");
          
          // Create a simple true/false quiz with extracted information from the response
          const lines = cleanedResponse.split(/\n/).filter(line => 
            line.trim().length > 10 && 
            !line.startsWith('<') && 
            !line.startsWith('```')
          );
          
          // Get 5 statements to use for quiz questions (or fewer if not enough lines)
          const statements = lines.slice(0, 5);
          
          // Create fallback questions
          const fallbackQuestions = statements.map((statement, index) => ({
            id: `q${index + 1}`,
            text: `Based on the video, is this statement correct? "${statement.substring(0, 100)}"`,
            type: "multipleChoice",
            points: 1,
            options: [
              {id: `q${index + 1}-a`, text: "True", isCorrect: true},
              {id: `q${index + 1}-b`, text: "False", isCorrect: false},
              {id: `q${index + 1}-c`, text: "Not mentioned", isCorrect: false},
              {id: `q${index + 1}-d`, text: "Partially correct", isCorrect: false}
            ]
          }));
          
          // If we couldn't extract enough statements, add generic questions
          if (fallbackQuestions.length < 2) {
            fallbackQuestions.push({
              id: "q-fallback",
              text: "Did you find this video content informative?",
              type: "multipleChoice",
              points: 1,
              options: [
                {id: "q-fallback-a", text: "Yes, very informative", isCorrect: true},
                {id: "q-fallback-b", text: "No, not informative", isCorrect: false},
                {id: "q-fallback-c", text: "Somewhat informative", isCorrect: false},
                {id: "q-fallback-d", text: "Need more details", isCorrect: false}
              ]
            });
          }
          
          console.log(`[AI_TUTOR_FALLBACK_SUCCESS] Generated ${fallbackQuestions.length} fallback questions`);
          
          return NextResponse.json({ 
            quiz: fallbackQuestions,
            isServerFallback: true
          }, { status: 200 });
        } catch (fallbackError) {
          console.error("[AI_TUTOR_FALLBACK_ERROR]", fallbackError);
          // If fallback generation fails, return the raw text so client can try to recover
          return NextResponse.json({ 
            error: "Failed to generate valid quiz data", 
            text: cleanedResponse 
          }, { status: 400 });
        }
      }
    }
    
    // Log the interaction to database if possible
    try {
      if (user.id) {
        const dbUser = await client.user.findUnique({
          where: { clerkid: user.id }
      });
      
      if (dbUser) {
          await client.aiTutorInteraction.create({
          data: {
            userId: dbUser.id,
            prompt,
              response: cleanedResponse || "",
            context: context || "general_help"
          }
        });
          console.log(`[AI_TUTOR_LOG_SUCCESS] Interaction logged to database`);
        } else {
          console.log(`[AI_TUTOR_LOG_WARNING] Could not find database user for clerk ID: ${user.id}`);
        }
      }
    } catch (dbError) {
      // Don't fail the request if logging fails
      console.error("[AI_TUTOR_LOG_ERROR]", dbError);
    }
    
    return NextResponse.json({ 
      text: cleanedResponse
    }, { status: 200 });
    
  } catch (error: any) {
    console.error("[AI_TUTOR_ERROR]", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json({
      error: "Internal server error", 
      message: error.message
    }, { status: 500 });
  }
} 