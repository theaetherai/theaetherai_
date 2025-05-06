import { onAuthenticateUser } from '@/actions/user'
import { redirect } from 'next/navigation'
import { client } from '@/lib/prisma'
import { safeCourseAccess } from '@/lib/safe-auth'
import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LessonForm from '@/components/courses/lesson-form'

interface EditLessonPageProps {
  params: {
    courseId: string
    lessonId: string
  }
}

export default async function EditLessonPage({ params }: EditLessonPageProps) {
  const { courseId, lessonId } = params
  
  console.log(`[EDIT_LESSON_PAGE] Started loading: courseId=${courseId}, lessonId=${lessonId}`)
  
  // Keep requiring authentication for edit pages
  const authResult = await safeCourseAccess();
  if (!authResult.authenticated) {
    console.log('[EDIT_LESSON_PAGE] Auth failed, redirecting to sign-in');
    return redirect('/auth/sign-in');
  }
  console.log(`[EDIT_LESSON_PAGE] User authenticated: ${authResult.user?.id || 'fallback auth'}`);
  
  // Only continue with full authentication for edit functionality
  if (!authResult.user) {
    console.log('[EDIT_LESSON_PAGE] Fallback auth not sufficient for editing, redirecting');
    return redirect('/auth/sign-in');
  }
  
  // Get user data from database
  const auth = await onAuthenticateUser()
  if (auth.status !== 200 && auth.status !== 201) {
    console.log(`[EDIT_LESSON_PAGE] Database auth failed: status=${auth.status}`)
    return redirect('/auth/sign-in')
  }

  // Get user record with workspace
  const dbUser = await client.user.findUnique({
    where: { clerkid: authResult.user.id },
    select: { 
      id: true,
      workspace: {
        select: {
          id: true
        },
        take: 1
      }
    }
  })

  if (!dbUser || !dbUser.workspace[0]) {
    console.log(`[EDIT_LESSON_PAGE] No workspace found for user`)
    return redirect('/auth/sign-in')
  }

  const workspaceId = dbUser.workspace[0].id
  console.log(`[EDIT_LESSON_PAGE] Found workspace: ${workspaceId}`)

  // Verify course exists and user is owner
  const course = await client.course.findUnique({
    where: { id: courseId },
    select: { 
      title: true,
      userId: true 
    }
  })

  if (!course) {
    console.log(`[EDIT_LESSON_PAGE] Course not found: ${courseId}`)
    return redirect('/courses')
  }

  if (course.userId !== dbUser.id) {
    console.log(`[EDIT_LESSON_PAGE] User is not course owner: courseUserId=${course.userId}, userId=${dbUser.id}`)
    return redirect(`/courses/${courseId}`)
  }
  console.log(`[EDIT_LESSON_PAGE] Course access verified: ${course.title}`)

  // Get the lesson data
  const lesson = await client.lesson.findUnique({
    where: {
      id: lessonId,
      courseId: courseId
    },
    include: {
      video: {
        select: {
          id: true,
          title: true,
          source: true
        }
      }
    }
  })

  if (!lesson) {
    console.log(`[EDIT_LESSON_PAGE] Lesson not found: ${lessonId}`)
    return redirect(`/courses/${courseId}`)
  }
  console.log(`[EDIT_LESSON_PAGE] Lesson data loaded: ${lesson.title}, type=${lesson.type}`)

  console.log(`[EDIT_LESSON_PAGE] Rendering lesson edit form`)
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href={`/courses/${courseId}`}>
          <Button 
            variant="ghost" 
            className="px-0 text-[#9D9D9D] hover:text-white"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Course
          </Button>
        </Link>
        
        <h1 className="text-3xl font-bold text-white mt-4 mb-2">Edit Lesson</h1>
        <p className="text-[#9D9D9D]">
          Modify lesson for "{course.title}"
        </p>
      </div>
      
      <div className="bg-[#111111] rounded-lg p-6 border border-[#2A2A2A]">
        <LessonForm 
          initialData={{
            title: lesson.title,
            content: lesson.content,
            videoId: lesson.videoId,
            video: lesson.video,
            type: lesson.type,
            previewable: lesson.previewable || false
          }}
          courseId={courseId}
          lessonId={lessonId}
          isEditing={true}
          workspaceId={workspaceId}
        />
      </div>
    </div>
  )
} 