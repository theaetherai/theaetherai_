import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    const { answers, score, passed, timeSpent } = await req.json();
    
    // Validate required fields
    if (!answers || score === undefined) {
      return new Response("Missing required fields", { status: 400 });
    }
    
    // Get the database user id from the auth id
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id }
    });
    
    if (!dbUser) {
      return new Response("User not found", { status: 404 });
    }
    
    const lessonId = params.lessonId;
    
    // Get the lesson to make sure it exists and is a quiz
    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: { section: { include: { course: true } } }
    });
    
    if (!lesson) {
      return new Response("Lesson not found", { status: 404 });
    }
    
    if (lesson.type !== 'quiz') {
      return new Response("This lesson is not a quiz", { status: 400 });
    }
    
    // Check if the user is enrolled in the course
    const enrollment = await db.enrollment.findFirst({
      where: {
        userId: dbUser.id,
        courseId: lesson.section.courseId
      }
    });
    
    if (!enrollment && !lesson.previewable) {
      return new Response("Not enrolled in this course", { status: 403 });
    }
    
    // Create a new quiz attempt
    const quizAttempt = await db.quizAttempt.create({
      data: {
        userId: dbUser.id,
        lessonId: lessonId,
        score: score,
        passed: passed || false,
        timeSpent: timeSpent,
        answers: answers // This should be a JSON array with each answer
      }
    });
    
    // Update user's progress for this lesson
    await db.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: dbUser.id,
          lessonId: lessonId
        }
      },
      update: {
        progress: 100,
        completed: true,
        lastAccessed: new Date()
      },
      create: {
        userId: dbUser.id,
        lessonId: lessonId,
        progress: 100,
        completed: true,
        lastAccessed: new Date()
      }
    });
    
    // Update course progress
    // Count total lessons in the course
    const totalLessons = await db.lesson.count({
      where: {
        section: {
          courseId: lesson.section.courseId
        }
      }
    });
    
    // Count completed lessons
    const completedLessons = await db.lessonProgress.count({
      where: {
        userId: dbUser.id,
        completed: true,
        lesson: {
          section: {
            courseId: lesson.section.courseId
          }
        }
      }
    });
    
    // Calculate overall course progress
    const courseProgress = Math.floor((completedLessons / totalLessons) * 100);
    
    // Update course enrollment with progress
    await db.enrollment.update({
      where: {
        userId_courseId: {
          userId: dbUser.id,
          courseId: lesson.section.courseId
        }
      },
      data: {
        progress: courseProgress,
        completed: courseProgress === 100
      }
    });
    
    return NextResponse.json({ 
      data: quizAttempt
    }, { status: 200 });
  } catch (error) {
    console.error("[QUIZ_ATTEMPT]", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    const user = await currentUser();
    const { searchParams } = new URL(req.url);
    const latest = searchParams.get("latest") === "true";
    
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    // Get the database user id from the auth id
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id }
    });
    
    if (!dbUser) {
      return new Response("User not found", { status: 404 });
    }
    
    const lessonId = params.lessonId;
    
    if (latest) {
      // Get the latest attempt only
      const latestAttempt = await db.quizAttempt.findFirst({
        where: {
          userId: dbUser.id,
          lessonId
        },
        orderBy: {
          createdAt: "desc"
        }
      });
      
      return NextResponse.json({ 
        data: latestAttempt || null
      }, { status: 200 });
    } else {
      // Get all attempts for this quiz
      const attempts = await db.quizAttempt.findMany({
        where: {
          userId: dbUser.id,
          lessonId
        },
        orderBy: {
          createdAt: "desc"
        }
      });
      
      return NextResponse.json({ 
        data: attempts
      }, { status: 200 });
    }
  } catch (error) {
    console.error("[QUIZ_ATTEMPT_GET]", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    const user = await currentUser();
    const { searchParams } = new URL(req.url);
    const attemptId = searchParams.get("attemptId");
    
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    // Get the database user id from the auth id
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id }
    });
    
    if (!dbUser) {
      return new Response("User not found", { status: 404 });
    }
    
    const lessonId = params.lessonId;
    
    // Get the lesson to verify permissions
    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: { 
        section: { 
          include: { 
            course: {
              select: { userId: true }
            } 
          } 
        } 
      }
    });
    
    if (!lesson) {
      return new Response("Lesson not found", { status: 404 });
    }
    
    // If an attempt ID is provided, delete that specific attempt
    if (attemptId) {
      const attempt = await db.quizAttempt.findUnique({
        where: { id: attemptId }
      });
      
      if (!attempt) {
        return new Response("Quiz attempt not found", { status: 404 });
      }
      
      // Only the user who created the attempt or the course owner can delete it
      if (attempt.userId !== dbUser.id && 
          lesson.section.course.userId !== dbUser.id && 
          !user.publicMetadata.isAdmin) {
        return new Response("Not authorized to delete this attempt", { status: 403 });
      }
      
      await db.quizAttempt.delete({
        where: { id: attemptId }
      });
    } else {
      // Only course owner or admin can delete all attempts for a lesson
      if (lesson.section.course.userId !== dbUser.id && !user.publicMetadata.isAdmin) {
        return new Response("Not authorized to delete all attempts", { status: 403 });
      }
      
      // Delete all attempts for this lesson
      await db.quizAttempt.deleteMany({
        where: { lessonId }
      });
    }
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[QUIZ_ATTEMPT_DELETE]", error);
    return new Response("Internal Server Error", { status: 500 });
  }
} 