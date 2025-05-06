import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { client } from "../../../../../../lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    const { answers, score, passed, timeSpent } = await req.json();
    
    // Validate required fields
    if (!answers || score === undefined) {
      return new Response("Missing required fields", { status: 400 });
    }
    
    // Get the database user id from the auth id
    const dbUser = await client.user.findUnique({
      where: { clerkid: userId }
    });
    
    if (!dbUser) {
      return new Response("User not found", { status: 404 });
    }
    
    const lessonId = params.lessonId;
    
    // Get the lesson to make sure it exists and is a quiz
    const lesson = await client.lesson.findUnique({
      where: { id: lessonId },
      include: { section: true }
    });
    
    if (!lesson) {
      return new Response("Lesson not found", { status: 404 });
    }
    
    if (lesson.type !== 'quiz') {
      return new Response("This lesson is not a quiz", { status: 400 });
    }
    
    // Check if the user is enrolled in the course
    const enrollment = await client.enrollment.findFirst({
      where: {
        userId: dbUser.id,
        courseId: lesson.section.courseId
      }
    });
    
    if (!enrollment && !lesson.previewable) {
      return new Response("Not enrolled in this course", { status: 403 });
    }
    
    // Create a new quiz attempt
    const quizAttempt = await client.quizAttempt.create({
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
    await client.lessonProgress.upsert({
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
    const totalLessons = await client.lesson.count({
      where: {
        sectionId: {
          in: await client.section.findMany({
            where: { courseId: lesson.section.courseId },
            select: { id: true }
          }).then(sections => sections.map(s => s.id))
        }
      }
    });
    
    // Count completed lessons
    const completedLessons = await client.lessonProgress.count({
      where: {
        userId: dbUser.id,
        completed: true,
        lesson: {
          sectionId: {
            in: await client.section.findMany({
              where: { courseId: lesson.section.courseId },
              select: { id: true }
            }).then(sections => sections.map(s => s.id))
          }
        }
      }
    });
    
    // Calculate overall course progress
    const courseProgress = Math.floor((completedLessons / totalLessons) * 100);
    
    // Update course enrollment with progress
    if (enrollment) {
      await client.enrollment.update({
        where: {
          id: enrollment.id
        },
        data: {
          progress: courseProgress,
          completed: courseProgress === 100
        }
      });
    }
    
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
    const { userId } = getAuth(req);
    const { searchParams } = new URL(req.url);
    const latest = searchParams.get("latest") === "true";
    
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    // Get the database user id from the auth id
    const dbUser = await client.user.findUnique({
      where: { clerkid: userId }
    });
    
    if (!dbUser) {
      return new Response("User not found", { status: 404 });
    }
    
    const lessonId = params.lessonId;
    
    if (latest) {
      // Get the latest attempt only
      const latestAttempt = await client.quizAttempt.findFirst({
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
      const attempts = await client.quizAttempt.findMany({
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
    const { userId } = getAuth(req);
    const { searchParams } = new URL(req.url);
    const attemptId = searchParams.get("attemptId");
    
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    // Get the database user id from the auth id
    const dbUser = await client.user.findUnique({
      where: { clerkid: userId }
    });
    
    if (!dbUser) {
      return new Response("User not found", { status: 404 });
    }
    
    const lessonId = params.lessonId;
    
    // Get the lesson to verify permissions
    const lesson = await client.lesson.findUnique({
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
      const attempt = await client.quizAttempt.findUnique({
        where: { id: attemptId }
      });
      
      if (!attempt) {
        return new Response("Attempt not found", { status: 404 });
      }
      
      // Only the quiz taker or course owner can delete an attempt
      if (attempt.userId !== dbUser.id && lesson.section.course.userId !== dbUser.id) {
        return new Response("Not authorized to delete this attempt", { status: 403 });
      }
      
      await client.quizAttempt.delete({
        where: { id: attemptId }
      });
      
      return NextResponse.json({ 
        message: "Attempt deleted successfully"
      }, { status: 200 });
    } else {
      // No specific attempt ID, delete all attempts for this user and lesson
      
      // Only the quiz taker or course owner can delete attempts
      if (lesson.section.course.userId !== dbUser.id) {
        // If not the course owner, can only delete their own attempts
        await client.quizAttempt.deleteMany({
          where: {
            userId: dbUser.id,
            lessonId
          }
        });
      } else {
        // Course owner can delete all attempts for the lesson
        await client.quizAttempt.deleteMany({
          where: { lessonId }
        });
      }
      
      return NextResponse.json({ 
        message: "Attempts deleted successfully"
      }, { status: 200 });
    }
  } catch (error) {
    console.error("[QUIZ_ATTEMPT_DELETE]", error);
    return new Response("Internal Server Error", { status: 500 });
  }
} 