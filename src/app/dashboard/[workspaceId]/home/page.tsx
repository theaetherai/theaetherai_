import { getWixContent, howToPost } from '@/actions/workspace'
import HowToPost from '@/components/global/how-to-post'
import VideoCard from '@/components/global/videos/video-card'
import React from 'react'
import { client } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import ProgressIndicator from '@/components/courses/progress-indicator'
import Link from 'next/link'
import { BookOpen, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TypographyH2, TypographyP, TypographyMuted } from '@/components/ui/typography'

interface Props {
  params: {
    workspaceId: string
  }
}

const Home = async ({ params }: Props) => {
  const { workspaceId } = params
  const videos = await getWixContent()
  const post = await howToPost()

  // Get current user
  const user = await currentUser()
  if (!user) {
    return redirect('/auth/sign-in')
  }

  // Get user record
  const dbUser = await client.user.findUnique({
    where: { clerkid: user.id },
    select: { id: true }
  })

  if (!dbUser) {
    return redirect('/auth/sign-in')
  }

  // Get user's courses and learning progress
  const enrolledCourses = await client.enrollment.findMany({
    where: { userId: dbUser.id },
    take: 3,
    orderBy: { createdAt: 'desc' },
    include: {
      Course: {
        include: {
          User: {
            select: {
              firstname: true,
              lastname: true,
              image: true
            }
          },
          lessons: {
            select: {
              id: true
            }
          }
        }
      }
    }
  })

  // Get learning progress
  const learningProgress = await client.learningProgress.findMany({
    where: {
      userId: dbUser.id,
      completed: true
    },
    select: {
      lessonId: true
    }
  })

  const completedLessonIds = new Set(learningProgress.map(progress => progress.lessonId))

  // Calculate progress for each course
  const coursesWithProgress = enrolledCourses
    .filter(enrollment => enrollment.Course) // Filter out any null courses
    .map(enrollment => {
      const totalLessons = enrollment.Course?.lessons.length || 0
      const completedLessons = enrollment.Course?.lessons.filter(
        lesson => completedLessonIds.has(lesson.id)
      ).length || 0
      
      const progress = totalLessons > 0 
        ? Math.round((completedLessons / totalLessons) * 100) 
        : 0
      
      return {
        id: enrollment.Course?.id,
        title: enrollment.Course?.title,
        progress
      }
    })

  return (
    <div className="space-y-8 pb-8">
      {/* Learning progress section */}
      {coursesWithProgress.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <TypographyH2>Continue Learning</TypographyH2>
            <Link href="/courses" className="text-muted-foreground hover:text-foreground text-sm flex items-center">
              View all courses
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coursesWithProgress.map((course) => (
              <Card key={course.id} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>
                    {course.progress === 100 ? 'Completed' : 'In progress'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <ProgressIndicator 
                      progress={course.progress} 
                      type="linear" 
                      showPercentage 
                    />
                  </div>
                  <Link href={`/courses/${course.id}`}>
                    <Button className="w-full">
                      <BookOpen className="mr-2 h-4 w-4" />
                      {course.progress === 100 ? 'Review Course' : 'Continue Learning'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
            
            {coursesWithProgress.length < 3 && (
              <Card className="bg-card border-border border-dashed flex flex-col justify-center items-center p-6">
                <BookOpen className="h-10 w-10 text-muted mb-2" />
                <TypographyMuted className="text-center mb-4">
                  Discover more courses to enhance your skills
                </TypographyMuted>
                <Link href="/home">
                  <Button variant="outline">
                    Explore Courses
                  </Button>
                </Link>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Original content */}
      <section>
        <TypographyH2 className="mb-4">A Message From The Opal Team</TypographyH2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:w-1/2">
          {videos.status === 200
            ? videos.data?.map((video) => (
                <VideoCard
                  key={video.id}
                  {...video}
                  workspaceId={video.workSpaceId!}
                />
              ))
            : ''}
          <HowToPost
            title={post?.title}
            html={post?.content}
          />
        </div>
      </section>
    </div>
  )
}

export default Home
