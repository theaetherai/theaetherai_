import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { 
  apiSuccess, 
  apiError, 
  apiUnauthorized, 
  apiNotFound, 
  apiForbidden, 
  apiNoContent 
} from "@/lib/api-response";

export async function POST(
  req: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return apiUnauthorized();
    }
    
    const { progress, completed } = await req.json();
    
    // Get the database user id from the auth id
    const dbUser = await prisma.user.findUnique({
      where: { clerkid: userId }
    });
    
    if (!dbUser) {
      return apiNotFound("User not found");
    }
    
    const lessonId = params.lessonId;
    
    // Get the lesson to make sure it exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { 
        section: true
      }
    });
    
    if (!lesson) {
      return apiNotFound("Lesson not found");
    }
    
    // Check if the user is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: dbUser.id,
        courseId: lesson.section.courseId
      }
    });
    
    if (!enrollment && !lesson.previewable) {
      return apiForbidden("Not enrolled in this course");
    }
    
    // Update or create progress record
    const lessonProgress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: dbUser.id,
          lessonId: lessonId
        }
      },
      update: {
        progress: progress,
        completed: completed || false
      },
      create: {
        userId: dbUser.id,
        lessonId: lessonId,
        progress: progress,
        completed: completed || false
      }
    });
    
    // Update course progress if needed
    if (completed) {
      // Count total lessons in the course
      const totalLessons = await prisma.lesson.count({
        where: {
          sectionId: {
            in: await prisma.section.findMany({
              where: { courseId: lesson.section.courseId },
              select: { id: true }
            }).then(sections => sections.map(s => s.id))
          }
        }
      });
      
      // Count completed lessons
      const completedLessons = await prisma.lessonProgress.count({
        where: {
          userId: dbUser.id,
          completed: true,
          lesson: {
            sectionId: {
              in: await prisma.section.findMany({
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
        await prisma.enrollment.update({
          where: {
            id: enrollment.id
          },
          data: {
            completed: courseProgress === 100,
            completedAt: courseProgress === 100 ? new Date() : null
          }
        });
      }
    }
    
    return apiSuccess(lessonProgress);
  } catch (error) {
    console.error("[LESSON_PROGRESS]", error);
    return apiError("Internal Server Error");
  }
}

export async function GET(
  req: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return apiUnauthorized();
    }
    
    // Get the database user id from the auth id
    const dbUser = await prisma.user.findUnique({
      where: { clerkid: userId }
    });
    
    if (!dbUser) {
      return apiNotFound("User not found");
    }
    
    const lessonId = params.lessonId;
    
    // Get progress for this lesson
    const progress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: dbUser.id,
          lessonId: lessonId
        }
      }
    });
    
    if (!progress) {
      return apiSuccess({ progress: 0, completed: false });
    }
    
    return apiSuccess(progress);
  } catch (error) {
    console.error("[LESSON_PROGRESS_GET]", error);
    return apiError("Internal Server Error");
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return apiUnauthorized();
    }
    
    // Get the database user id from the auth id
    const dbUser = await prisma.user.findUnique({
      where: { clerkid: userId }
    });
    
    if (!dbUser) {
      return apiNotFound("User not found");
    }
    
    const lessonId = params.lessonId;
    
    // Get the lesson to make sure it exists
    const lesson = await prisma.lesson.findUnique({
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
      return apiNotFound("Lesson not found");
    }
    
    // Only course owner or the user who created the progress can delete it
    const isAdmin = dbUser.role === "admin";
    if (lesson.section.course.userId !== dbUser.id && !isAdmin) {
      return apiForbidden("Not authorized to delete this progress");
    }
    
    // Delete progress record
    await prisma.lessonProgress.delete({
      where: {
        userId_lessonId: {
          userId: dbUser.id,
          lessonId: lessonId
        }
      }
    });
    
    return apiNoContent();
  } catch (error) {
    console.error("[LESSON_PROGRESS_DELETE]", error);
    return apiError("Internal Server Error");
  }
} 