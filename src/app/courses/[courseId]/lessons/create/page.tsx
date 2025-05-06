import { onAuthenticateUser } from '@/actions/user'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { client } from '@/lib/prisma'
import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LessonForm from '@/components/courses/lesson-form'

interface CreateLessonPageProps {
  params: {
    courseId: string
  }
}

export default async function CreateLessonPage({ params }: CreateLessonPageProps) {
  const { courseId } = params
  
  // Authentication check
  const auth = await onAuthenticateUser()
  if (auth.status !== 200 && auth.status !== 201) {
    return redirect('/auth/sign-in')
  }

  // Get current user
  const user = await currentUser()
  if (!user) {
    return redirect('/auth/sign-in')
  }

  // Get user's workspace for video selection
  const dbUser = await client.user.findUnique({
    where: { clerkid: user.id },
    select: { 
      id: true,
      workspace: {
        select: { id: true }
      }
    }
  })

  if (!dbUser || !dbUser.workspace || dbUser.workspace.length === 0) {
    return redirect('/dashboard')
  }

  // Default to first workspace
  const workspaceId = dbUser.workspace[0].id

  // Check if course exists and user has access
  const course = await client.course.findUnique({
    where: {
      id: courseId,
      OR: [
        { userId: dbUser.id }, // Course creator
        { 
          enrollments: {
            some: { userId: dbUser.id }
          }
        } // Enrolled user
      ]
    },
    select: {
      id: true,
      title: true,
      userId: true
    }
  })

  if (!course) {
    return redirect('/courses')
  }

  // Only course creator can add lessons
  if (course.userId !== dbUser.id) {
    return redirect(`/courses/${courseId}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href={`/courses/${courseId}`}>
          <Button 
            variant="ghost" 
            className="px-0 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Course
          </Button>
        </Link>
        
        <h1 className="text-3xl font-bold text-foreground mt-4 mb-2">Add New Lesson</h1>
        <p className="text-muted-foreground">
          Create a new lesson for "{course.title}"
        </p>
      </div>
      
      <div className="bg-background rounded-lg shadow-md">
        <LessonForm 
          courseId={courseId} 
          workspaceId={workspaceId}
        />
      </div>
    </div>
  )
} 