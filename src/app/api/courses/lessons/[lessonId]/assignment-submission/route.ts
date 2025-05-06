import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { client } from "../../../../../../lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { userId } = getAuth(req);
    
    if (!user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    const { content, fileUrls } = await req.json();
    
    // Validate inputs
    if (!content && (!fileUrls || fileUrls.length === 0)) {
      return new Response("Submission must include content or files", { status: 400 });
    }
    
    // Get the database user id from the auth id
    const dbUser = await client.user.findUnique({
      where: { clerkid: userId }
    });
    
    if (!dbUser) {
      return new Response("User not found", { status: 404 });
    }
    
    const lessonId = params.lessonId;
    
    // Get the lesson to make sure it exists and is an assignment
    const lesson = await client.lesson.findUnique({
      where: { id: lessonId },
      include: { section: true }
    });
    
    if (!lesson) {
      return new Response("Lesson not found", { status: 404 });
    }
    
    if (lesson.type !== 'assignment') {
      return new Response("This lesson is not an assignment", { status: 400 });
    }
    
    // Check if the user is enrolled in the course
    const enrollment = await client.enrollment.findFirst({
      where: {
        userId: dbUser.id,
        courseId: lesson.section?.courseId
      }
    });
    
    if (!enrollment && !lesson.previewable) {
      return new Response("Not enrolled in this course", { status: 403 });
    }
    
    // Check if there's an existing submission
    const existingSubmission = await client.assignmentSubmission.findFirst({
      where: {
        userId: dbUser.id,
        lessonId: lessonId
      }
    });
    
    let submission;
    
    if (existingSubmission) {
      // Check if already graded - don't allow edits in that case
      if (existingSubmission.status === 'graded') {
        return new Response("Cannot edit a graded submission", { status: 400 });
      }
      
      // Update existing submission
      submission = await client.assignmentSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          content,
          fileUrls,
          status: 'submitted',
          submittedAt: new Date(),
          grade: null,
          feedback: null
        }
      });
    } else {
      // Create a new submission
      submission = await client.assignmentSubmission.create({
        data: {
          userId: dbUser.id,
          lessonId: lessonId,
          content,
          fileUrls,
          status: 'submitted',
          submittedAt: new Date()
        }
      });
    }
    
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
            where: { courseId: lesson.section?.courseId },
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
              where: { courseId: lesson.section?.courseId },
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
          completed: courseProgress === 100
        }
      });
    }
    
    return NextResponse.json({ 
      data: submission
    }, { status: 200 });
  } catch (error) {
    console.error("[ASSIGNMENT_SUBMISSION]", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { userId } = getAuth(req);
    
    if (!user?.id) {
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
    
    // Get submission for this assignment
    const submission = await client.assignmentSubmission.findFirst({
      where: {
        userId: dbUser.id,
        lessonId
      },
      orderBy: {
        submittedAt: "desc"
      }
    });
    
    if (!submission) {
      return new Response("No submission found", { status: 404 });
    }
    
    return NextResponse.json({ 
      data: submission 
    }, { status: 200 });
  } catch (error) {
    console.error("[ASSIGNMENT_SUBMISSION_GET]", error);
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
    const submissionId = searchParams.get("submissionId");
    
    if (!user?.id) {
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
    
    // If a submission ID is provided, delete that specific submission
    if (submissionId) {
      const submission = await client.assignmentSubmission.findUnique({
        where: { id: submissionId }
      });
      
      if (!submission) {
        return new Response("Submission not found", { status: 404 });
      }
      
      // Only the submission owner or course owner can delete a submission
      if (submission.userId !== dbUser.id && 
          lesson.section?.course?.userId !== dbUser.id) {
        return new Response("Not authorized to delete this submission", { status: 403 });
      }
      
      await client.assignmentSubmission.delete({
        where: { id: submissionId }
      });
      
      return NextResponse.json({
        message: "Submission deleted"
      }, { status: 200 });
    } else {
      // No specific submission ID, delete all submissions for this user and lesson
      
      // Only the course owner can delete all submissions
      if (lesson.section?.course?.userId !== dbUser.id) {
        return new Response("Not authorized to delete all submissions", { status: 403 });
      }
      
      await client.assignmentSubmission.deleteMany({
        where: { lessonId }
      });
      
      return NextResponse.json({
        message: "All submissions deleted"
      }, { status: 200 });
    }
  } catch (error) {
    console.error("[ASSIGNMENT_SUBMISSION_DELETE]", error);
    return new Response("Internal Server Error", { status: 500 });
  }
} 