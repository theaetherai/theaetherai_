import { redirect } from "next/navigation";
import { client } from "@/lib/prisma";
import { safeCurrentUser, hasUserSession } from "@/lib/safe-auth";
import LessonView from "@/components/courses/lesson-view";

interface LessonPageProps {
  params: {
    courseId: string;
    lessonId: string;
  };
}

const LessonPage = async ({ params }: LessonPageProps) => {
  console.log("Lesson page loading with params:", params);
  
  try {
    // Use our safer authentication function
    const user = await safeCurrentUser();
    
    if (!user) {
      console.log("No authenticated user found, checking for session cookies");
      
      // As a fallback, check if we have session cookies even if Clerk API failed
      const hasSession = hasUserSession();
      
      if (!hasSession) {
        console.log("No session found, redirecting to sign-in");
        return redirect("/auth/sign-in");
      }
      
      console.log("Session exists but couldn't get user details - showing public lesson view");
      
      // Get the lesson without requiring authentication
      const lesson = await client.lesson.findUnique({
        where: {
          id: params.lessonId,
        },
        include: {
          section: {
            include: {
              Course: true,
            },
          },
          video: true,
        },
      });
      
      if (!lesson) {
        console.log("Lesson not found with ID:", params.lessonId);
        return redirect(`/courses/${params.courseId}`);
      }
      
      if (!lesson.previewable) {
        console.log("Lesson is not previewable and authentication failed");
        return redirect(`/courses/${params.courseId}`);
      }
      
      console.log("Showing previewable lesson to user with auth issues");
      
      return (
        <div className="max-w-5xl mx-auto pb-12">
          <LessonView
            courseId={params.courseId}
            lessonId={lesson.id}
            title={lesson.title}
            description={lesson.description || undefined}
            type={lesson.type as 'video' | 'text' | 'quiz' | 'assignment'}
            content={lesson.content || undefined}
            videoId={lesson.videoId ? lesson.videoId : undefined}
            isPreview={true}
            isOwner={false}
          />
        </div>
      );
    }
    
    console.log("User authenticated:", user.id);
    
    // Get user ID from database
    const dbUser = await client.user.findUnique({
      where: { 
        clerkid: user.id 
      },
      select: { id: true }
    });
    
    if (!dbUser) {
      console.log("Database user not found for clerk ID:", user.id);
      return redirect("/auth/sign-in");
    }
    
    console.log("Database user found:", dbUser.id);
    
    const lesson = await client.lesson.findUnique({
      where: {
        id: params.lessonId,
      },
      include: {
        section: {
          include: {
            Course: true,
          },
        },
        video: true,
      },
    });
    
    if (!lesson) {
      console.log("Lesson not found with ID:", params.lessonId);
      return redirect(`/courses/${params.courseId}`);
    }
    
    console.log("Lesson found:", lesson.id, lesson.title);
    console.log("Lesson type:", lesson.type);
    console.log("Lesson data structure:", {
      hasQuestions: !!lesson.questions,
      hasRubric: !!lesson.rubric,
      hasContent: !!lesson.content,
      hasVideo: !!lesson.videoId
    });
    
    // Check if the user is enrolled in the course
    const courseId = lesson.section?.Course?.id || params.courseId;
    console.log("Looking for enrollment with courseId:", courseId);
    
    const enrollment = await client.enrollment.findFirst({
      where: {
        userId: dbUser.id,
        courseId: courseId
      }
    });
    
    console.log("Enrollment check result:", enrollment ? "Enrolled" : "Not enrolled");
    
    // Check if lesson is previewable or user is enrolled
    const isPreview = lesson.previewable && !enrollment;
    const isOwner = lesson.section?.Course?.userId === dbUser.id;
    const canAccess = !!enrollment || isPreview || isOwner;
    
    console.log("Access check:", { isPreview, isOwner, canAccess });
    
    if (!canAccess) {
      console.log("User cannot access this lesson, redirecting to course page");
      return redirect(`/courses/${params.courseId}`);
    }
    
    // Find the next and previous lessons
    const courseLessons = await client.lesson.findMany({
      where: {
        section: {
          courseId: params.courseId,
        },
      },
      orderBy: [
        {
          section: {
            order: "asc",
          },
        },
        {
          order: "asc",
        },
      ],
      select: {
        id: true,
      },
    });
    
    const lessonIds = courseLessons.map((lesson) => lesson.id);
    const currentIndex = lessonIds.findIndex((id) => id === params.lessonId);
    
    const prevLessonId = currentIndex > 0 ? lessonIds[currentIndex - 1] : null;
    const nextLessonId =
      currentIndex < lessonIds.length - 1 ? lessonIds[currentIndex + 1] : null;
    
    // Get lesson-type specific data
    let quizData = null;
    let assignmentData = null;
    
    if (lesson.type === 'quiz' && lesson.questions) {
      console.log('[LESSON_PAGE] Quiz lesson found, questions data type:', typeof lesson.questions);
      console.log('[LESSON_PAGE] Raw questions data:', lesson.questions);
      
      try {
        quizData = typeof lesson.questions === 'string' 
          ? JSON.parse(lesson.questions) 
          : lesson.questions;
        console.log('[LESSON_PAGE] Parsed quiz data successfully, question count:', 
          Array.isArray(quizData) ? quizData.length : 'not an array');
        console.log('[LESSON_PAGE] First question sample:', quizData && Array.isArray(quizData) && quizData.length > 0 
          ? JSON.stringify(quizData[0]) 
          : 'no questions');
      } catch (e) {
        console.error('[LESSON_PAGE] Error parsing quiz questions:', e);
        quizData = [];
      }
    }
    
    if (lesson.type === 'assignment' && lesson.rubric) {
      try {
        assignmentData = {
          rubric: typeof lesson.rubric === 'string' 
            ? JSON.parse(lesson.rubric) 
            : lesson.rubric,
          dueDate: lesson.dueDate,
          fileTypes: lesson.fileTypes || [],
          maxFileSize: lesson.maxFileSize || 10,
          maxFiles: lesson.maxFiles || 1
        };
      } catch (e) {
        console.error('Error parsing assignment data:', e);
        assignmentData = { 
          rubric: [],
          fileTypes: [],
          maxFileSize: 10,
          maxFiles: 1
        };
      }
    }
    
    // Mark lesson as accessed if enrolled
    if (enrollment) {
      try {
        // Check if progress record exists
        const progressRecord = await client.learningProgress.findFirst({
          where: {
            userId: dbUser.id,
            lessonId: lesson.id
          }
        });
        
        if (progressRecord) {
          // Update existing record
          await client.learningProgress.update({
            where: { id: progressRecord.id },
            data: { updatedAt: new Date() }
          });
        } else {
          // Create new record
          await client.learningProgress.create({
            data: {
              userId: dbUser.id,
              lessonId: lesson.id,
              watchedSeconds: 0,
              completed: false
            }
          });
        }
      } catch (error) {
        console.error("Error updating lesson progress:", error);
      }
    }
    
    return (
      <div className="max-w-5xl mx-auto pb-12">
        <LessonView
          courseId={params.courseId}
          lessonId={lesson.id}
          title={lesson.title}
          description={lesson.description || undefined}
          type={lesson.type as 'video' | 'text' | 'quiz' | 'assignment'}
          content={lesson.content || undefined}
          videoId={lesson.videoId ? lesson.videoId : undefined}
          isPreview={isPreview}
          isOwner={isOwner}
          prevLessonId={prevLessonId ? prevLessonId : undefined}
          nextLessonId={nextLessonId ? nextLessonId : undefined}
          transcript={lesson.video?.transcript || undefined}
          questions={quizData}
          timeLimit={lesson.timeLimit || undefined}
          passingScore={lesson.passingScore || undefined}
          rubric={assignmentData?.rubric}
          dueDate={assignmentData?.dueDate?.toString()}
          fileTypes={assignmentData?.fileTypes || []}
          maxFileSize={assignmentData?.maxFileSize || 10}
          maxFiles={assignmentData?.maxFiles || 1}
        />
      </div>
    );
  } catch (error) {
    console.error("[LESSON_PAGE]", error);
    return redirect(`/courses/${params.courseId}`);
  }
};

export default LessonPage;