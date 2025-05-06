import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// GET - Fetch a specific lesson by ID
export async function GET(
  req: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the database user from the Clerk ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkid: user.id }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const lessonId = params.lessonId;

    // Fetch the lesson with its section and course data
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: {
          include: {
            Course: {
              select: {
                userId: true,
                title: true
              }
            }
          }
        },
        video: {
          select: {
            title: true,
            source: true,
            description: true
          }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Check if the user is authorized to view this lesson (course owner or admin)
    const isAdmin = dbUser.role === "admin";
    const isCourseOwner = lesson.section?.Course?.userId === dbUser.id;
    
    // Prepare response data with additional formatted data
    const lessonData = {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      type: lesson.type,
      order: lesson.order,
      duration: lesson.duration,
      previewable: lesson.previewable,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      sectionId: lesson.sectionId,
      videoId: lesson.videoId,
      questions: lesson.questions,
      passingScore: lesson.passingScore,
      timeLimit: lesson.timeLimit,
      rubric: lesson.rubric,
      dueDate: lesson.dueDate,
      fileTypes: lesson.fileTypes,
      maxFileSize: lesson.maxFileSize,
      maxFiles: lesson.maxFiles,
      
      // Additional fields derived from relations
      courseTitle: lesson.section?.Course?.title || null,
      videoTitle: lesson.video?.title || null,
      videoUrl: lesson.video?.source || null,
      videoDescription: lesson.video?.description || null,
    };

    return NextResponse.json({ 
      status: 200,
      data: lessonData
    });
  } catch (error) {
    console.error("[LESSON_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH - Update a lesson
export async function PATCH(
  req: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    console.log("[LESSON_UPDATE] Updating lesson:", params.lessonId);
    
    const user = await currentUser();

    if (!user) {
      console.log("[LESSON_UPDATE] Auth failed - no current user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the database user from the Clerk ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkid: user.id }
    });

    if (!dbUser) {
      console.log("[LESSON_UPDATE] Database user not found for Clerk ID:", user.id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    console.log("[LESSON_UPDATE] Database user found:", dbUser.id);

    const lessonId = params.lessonId;
    const body = await req.json();
    
    console.log("[LESSON_UPDATE] Request body keys:", Object.keys(body));
    
    if (body.questions) {
      console.log("[LESSON_UPDATE] Questions data type:", typeof body.questions);
      console.log("[LESSON_UPDATE] Questions length:", 
        typeof body.questions === 'string' ? body.questions.length : String(body.questions).length);
      
      // Log a sample of the questions data
      const questionsSample = typeof body.questions === 'string' 
        ? body.questions.substring(0, 200) + "..." 
        : String(body.questions).substring(0, 200) + "...";
      console.log("[LESSON_UPDATE] Questions sample:", questionsSample);
      
      // Try to parse and log more details if it's a string
      if (typeof body.questions === 'string') {
        try {
          const parsedQuestions = JSON.parse(body.questions);
          console.log("[LESSON_UPDATE] Parsed questions count:", 
            Array.isArray(parsedQuestions) ? parsedQuestions.length : "not an array");
            
          // Check for sample questions
          if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
            console.log("[LESSON_UPDATE] First question:", JSON.stringify(parsedQuestions[0], null, 2));
            
            const hasSampleQuestions = parsedQuestions.some(q => 
              q.id?.includes('sample') || 
              q.text?.includes('Sample Question') ||
              q.text?.includes('[SAMPLE]')
            );
            
            console.log("[LESSON_UPDATE] Contains sample questions:", hasSampleQuestions);
            
            // Check for custom question IDs
            const hasCustomIds = parsedQuestions.some(q => q.id?.includes('custom-q-'));
            console.log("[LESSON_UPDATE] Contains custom question IDs:", hasCustomIds);
          }
        } catch (error) {
          console.error("[LESSON_UPDATE] Error parsing questions string:", error);
        }
      }
    }

    // Fetch the lesson with its section and course data to check permissions
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: {
          include: {
            Course: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    });

    if (!lesson) {
      console.log("[LESSON_UPDATE] Lesson not found:", lessonId);
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }
    
    console.log("[LESSON_UPDATE] Found lesson:", lessonId, lesson.title);

    // Check if the user is authorized to update this lesson (course owner or admin)
    const isAdmin = dbUser.role === "admin";
    const isCourseOwner = lesson.section?.Course?.userId === dbUser.id;

    if (!isAdmin && !isCourseOwner) {
      console.log("[LESSON_UPDATE] User not authorized to update lesson. User:", dbUser.id, "Owner:", lesson.section?.Course?.userId);
      return NextResponse.json({ error: "Not authorized to update this lesson" }, { status: 403 });
    }
    
    console.log("[LESSON_UPDATE] User authorized for update. isAdmin:", isAdmin, "isCourseOwner:", isCourseOwner);

    // Extract update data from the request body based on the lesson type
    const {
      title,
      description,
      type,
      content,
      videoId,
      duration,
      previewable,
      questions,
      passingScore,
      timeLimit,
      rubric,
      dueDate,
      fileTypes,
      maxFileSize,
      maxFiles
    } = body;

    // Prepare the update data with core fields
    const updateData: any = {
      title: title,
      description: description,
      previewable: previewable
    };

    // Add type-specific fields if provided
    if (type) updateData.type = type;
    if (content !== undefined) updateData.content = content;
    if (videoId !== undefined) updateData.videoId = videoId;
    if (duration !== undefined) updateData.duration = duration;
    if (questions !== undefined) updateData.questions = typeof questions === 'string' ? questions : JSON.stringify(questions);
    
    // Ensure passingScore and timeLimit are properly parsed to integers
    if (passingScore !== undefined) {
      // Parse the passing score to an integer and validate
      try {
        const score = typeof passingScore === 'string' ? parseInt(passingScore) : passingScore;
        if (isNaN(score)) {
          console.error("[LESSON_UPDATE] Invalid passingScore (NaN):", passingScore);
          return NextResponse.json({ 
            error: "Invalid passing score value. Must be a number between 1 and 100." 
          }, { status: 400 });
        }
        updateData.passingScore = score;
        console.log("[LESSON_UPDATE] passingScore parsed to:", updateData.passingScore);
      } catch (error) {
        console.error("[LESSON_UPDATE] Error parsing passingScore:", error);
        return NextResponse.json({ 
          error: "Invalid passing score format. Must be a number between 1 and 100." 
        }, { status: 400 });
      }
    }
    
    if (timeLimit !== undefined) {
      // Parse the time limit to an integer and validate
      try {
        const limit = typeof timeLimit === 'string' ? parseInt(timeLimit) : timeLimit;
        if (isNaN(limit)) {
          console.error("[LESSON_UPDATE] Invalid timeLimit (NaN):", timeLimit);
          return NextResponse.json({ 
            error: "Invalid time limit value. Must be a positive number." 
          }, { status: 400 });
        }
        updateData.timeLimit = limit;
        console.log("[LESSON_UPDATE] timeLimit parsed to:", updateData.timeLimit);
      } catch (error) {
        console.error("[LESSON_UPDATE] Error parsing timeLimit:", error);
        return NextResponse.json({ 
          error: "Invalid time limit format. Must be a positive number." 
        }, { status: 400 });
      }
    }
    
    if (rubric !== undefined) updateData.rubric = rubric;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (fileTypes !== undefined) updateData.fileTypes = fileTypes;
    if (maxFileSize !== undefined) updateData.maxFileSize = maxFileSize;
    if (maxFiles !== undefined) updateData.maxFiles = maxFiles;
    
    console.log("[LESSON_UPDATE] Update data keys:", Object.keys(updateData));
    
    // For quiz updates, log additional details
    if (questions !== undefined) {
      console.log("[LESSON_UPDATE] Updating quiz questions");
      console.log("[LESSON_UPDATE] passingScore:", updateData.passingScore);
      console.log("[LESSON_UPDATE] timeLimit:", updateData.timeLimit);
    }

    // Update the lesson
    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: updateData
    });

    console.log("[LESSON_UPDATE] Lesson updated successfully");
    console.log("[LESSON_UPDATE] Updated lesson data keys:", Object.keys(updatedLesson));
    
    if (updatedLesson.questions) {
      console.log("[LESSON_UPDATE] Saved questions type:", typeof updatedLesson.questions);
      
      // Log a sample of the saved questions
      const savedQuestionsPreview = typeof updatedLesson.questions === 'string' 
        ? (updatedLesson.questions as string).substring(0, 200) + "..." 
        : String(updatedLesson.questions).substring(0, 200) + "...";
      
      console.log("[LESSON_UPDATE] Saved questions preview:", savedQuestionsPreview);
      
      try {
        if (typeof updatedLesson.questions === 'string') {
          const savedQuestions = JSON.parse(updatedLesson.questions);
          console.log("[LESSON_UPDATE] Parsed saved questions count:", 
            Array.isArray(savedQuestions) ? savedQuestions.length : "not an array");
            
          // Verify questions were saved properly
          if (Array.isArray(savedQuestions) && savedQuestions.length > 0) {
            console.log("[LESSON_UPDATE] First saved question:", JSON.stringify(savedQuestions[0], null, 2));
            
            // Check for sample questions in saved data
            const stillHasSampleQuestions = savedQuestions.some(q => 
              q.id?.includes('sample') || 
              q.text?.includes('Sample Question') ||
              q.text?.includes('[SAMPLE]')
            );
            
            if (stillHasSampleQuestions) {
              console.warn("[LESSON_UPDATE] WARNING: Saved data still contains sample questions!");
            } else {
              console.log("[LESSON_UPDATE] Saved data contains custom questions only - good!");
            }
          }
        }
      } catch (error) {
        console.error("[LESSON_UPDATE] Error parsing saved questions:", error);
      }
    } else {
      console.log("[LESSON_UPDATE] No questions saved in updatedLesson");
    }

    return NextResponse.json({ 
      status: 200,
      data: updatedLesson
    });
  } catch (error) {
    console.error("[LESSON_UPDATE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE - Delete a lesson
export async function DELETE(
  req: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkid: user.id }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const lessonId = params.lessonId;

    // Fetch the lesson with its section and course data to check permissions
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: {
          include: {
            Course: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Check if the user is authorized to delete this lesson (course owner or admin)
    const isAdmin = dbUser.role === "admin";
    const isCourseOwner = lesson.section?.Course?.userId === dbUser.id;

    if (!isAdmin && !isCourseOwner) {
      return NextResponse.json({ error: "Not authorized to delete this lesson" }, { status: 403 });
    }

    // Delete the lesson
    await prisma.lesson.delete({
      where: { id: lessonId }
    });

    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error("[LESSON_DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 