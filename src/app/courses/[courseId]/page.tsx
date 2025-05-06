import { onAuthenticateUser } from '@/actions/user'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { client } from '@/lib/prisma'
import { safeCourseAccess } from '@/lib/safe-auth'
import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BookPlus, ChevronRight, Edit, Trash2, UserPlus, UserCheck, BookOpen, Clock, Globe, User } from 'lucide-react'
import SectionList from '@/components/courses/section-list'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Suspense } from 'react'
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query'
import Breadcrumb from '@/components/breadcrumb'
import Image from 'next/image'
import LessonGrid from '@/components/courses/lesson-grid'
import { cleanCloudinaryUrl } from '@/lib/utils'
import { Lesson as PrismaLesson, Section as PrismaSection } from '@prisma/client'

interface CoursePageProps {
  params: {
    courseId: string
  }
}

// Define types for our data structures
interface Section {
  id: string;
  title: string;
  order: number;
  courseId: string | null;
  createdAt: Date;
  updatedAt: Date;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  content?: string | null;
  order: number;
  duration?: number | null;
  completed?: boolean;
  videoId?: string | null;
  video?: {
    id: string;
    title?: string | null;
  } | null;
}

interface LessonWithProgress extends PrismaLesson {
  completed?: boolean
  progress?: number
  videoThumbnail?: string | null
  videoTitle?: string | null
  User?: {
    firstname: string | null
    lastname: string | null
    image: string | null
  } | null
  video?: {
    id: string
    title: string | null
    source: string
  } | null
}

interface SectionWithLessons extends PrismaSection {
  description: string
  order: number
  createdAt: Date
  updatedAt: Date
  lessons: LessonWithProgress[]
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseId } = params
  
  // Use the safer auth check but don't enforce authentication
  const authResult = await safeCourseAccess();
  console.log('[COURSE_PAGE] Auth check result:', authResult.authenticated ? 'authenticated' : 'not authenticated');
  
  // Don't redirect if not authenticated - make courses publicly viewable
  // if (!authResult.authenticated) {
  //   console.log('[COURSE_PAGE] User not authenticated, redirecting to sign-in');
  //   redirect('/auth/sign-in')
  // }
  
  // Continue with database user lookup only if we have a user
  let dbUser;
  if (authResult.authenticated && authResult.user) {
    const auth = await onAuthenticateUser();
    if (auth.status === 200 || auth.status === 201) {
      dbUser = auth.user;
    }
  } else {
    console.log('[COURSE_PAGE] Showing public view of course page');
  }
  
  const queryClient = new QueryClient()
  
  // Get course with its lessons and author info
  const course = await client.course.findUnique({
    where: { id: courseId },
    include: {
      User: {
        select: {
          firstname: true,
          lastname: true,
          image: true
        }
      },
      lessons: {
        where: {
          courseId: courseId
        },
        orderBy: { order: 'asc' },
        include: {
          video: {
            select: {
              id: true,
              title: true,
              source: true
            }
          }
        }
      },
      enrollments: dbUser ? {
        where: {
          userId: dbUser?.id
        },
        take: 1
      } : undefined,
      _count: {
        select: {
          lessons: true,
          enrollments: true
        }
      }
    }
  })
  
  console.log('Course data:', {
    courseId,
    totalLessons: course?._count?.lessons,
    directLessons: course?.lessons.map(l => ({
      id: l.id,
      title: l.title,
      courseId: l.courseId
    }))
  })
  
  if (!course) {
    redirect("/courses")
  }
  
  // Organize lessons into sections
  const courseSections = await client.section.findMany({
    where: { courseId: courseId },
    include: {
      lessons: {
        where: {
          courseId: courseId
        },
        orderBy: { order: 'asc' },
        include: {
          video: {
            select: {
              id: true,
              title: true,
              source: true
            }
          }
        }
      }
    },
    orderBy: { order: 'asc' }
  })
  
  // Create a default "Uncategorized" section for lessons without a section
  const uncategorizedLessons = course.lessons.filter(lesson => !lesson.sectionId)
  const sectionsWithLessons = [
    ...courseSections,
    ...(uncategorizedLessons.length > 0 ? [{
      id: 'uncategorized',
      title: 'Uncategorized',
      description: 'Lessons not assigned to any section',
      order: 999,
      courseId: courseId,
      createdAt: new Date(),
      updatedAt: new Date(),
      lessons: uncategorizedLessons
    }] : [])
  ] as SectionWithLessons[]
  
  // Transform sections to include video information for lesson cards
  const sectionsWithVideoInfo = sectionsWithLessons.map(section => ({
    ...section,
    lessons: section.lessons.map(lesson => ({
      ...lesson,
      videoThumbnail: lesson.video?.source 
        ? cleanCloudinaryUrl(`${lesson.video.source.split('.').slice(0, -1).join('.')}.jpg`)
        : null,
      videoTitle: lesson.video?.title || null,
      User: course.User
    }))
  })) as SectionWithLessons[]
  
  // Author name
  const authorName = course.User 
    ? `${course.User.firstname} ${course.User.lastname}` 
    : 'Unknown Author'
  
  // Check enrollment status
  const isEnrolled = Boolean(dbUser && course.enrollments && course.enrollments.length > 0)
  const isOwner = Boolean(dbUser && course.userId === dbUser?.id)
  
  // Format time
  const timeAgo = course.updatedAt
    ? formatDistanceToNow(new Date(course.updatedAt), { addSuffix: true })
    : 'recently'
  
  return (
    <div className="container mx-auto px-4">
      <Breadcrumb 
        items={[
          { label: 'Courses', href: '/courses' },
          { label: course.title, href: `/courses/${courseId}` },
        ]} 
      />

      {/* What you'll learn card */}
      {course.objectives && course.objectives.length > 0 && (
        <div className="bg-card text-card-foreground py-6 px-6 mb-6 rounded-xl shadow-sm border border-border max-w-3xl animate-fade-in">
          <h2 className="text-xl font-medium mb-4">What you'll learn</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 list-disc pl-5">
            {course.objectives.map((obj, i) => (
              <li key={i} className="text-base text-muted-foreground">{obj}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Title, subtitle, meta info */}
      <div className="bg-card text-card-foreground py-8 -mx-4 px-4 mb-8 shadow-sm border-y border-border animate-fade-in delay-1">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h1 className="text-2xl md:text-3xl font-semibold mb-3 tracking-tight">{course.title}</h1>
            <div className="mb-4 text-lg text-muted-foreground">{course.shortDescription || course.description}</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>Created by </span>
                <span className="font-medium">{authorName}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Last updated </span>
                <span>{timeAgo}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Language: English</span>
              </div>
              {course._count?.enrollments !== undefined && (
                <div className="flex items-center gap-1">
                  <UserCheck className="h-4 w-4" />
                  <span>{course._count.enrollments} students enrolled</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Course Preview Card - floating on desktop */}
          <div className="bg-muted p-4 md:p-6 rounded-lg shadow-md">
            <div className="text-center mb-4">
              <p className="text-xl md:text-2xl font-bold">{isEnrolled ? "You're enrolled" : "Enroll Today"}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {isEnrolled 
                  ? "Continue your learning journey" 
                  : "Join other students learning this course"}
              </p>
            </div>
            
            <div className="space-y-4">
              {isEnrolled ? (
                // Already enrolled - show continue button
                <Button className="w-full text-primary-foreground" asChild>
                  <Link href={`/courses/${courseId}/learn`}>
                    Continue Learning
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                // Not enrolled - show enroll button
                <form action={async () => {
                  'use server'
                  // Enrollment logic
                }}>
                  <Button className="w-full text-primary-foreground" type="submit">
                    Enroll in Course
                    <UserPlus className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              )}
              
              {/* Course management buttons for owner */}
              {isOwner && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-medium mb-2">Course Management</p>
                  <Button variant="outline" className="w-full justify-start text-foreground" asChild>
                    <Link href={`/courses/${courseId}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Course
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-foreground" asChild>
                    <Link href={`/courses/${courseId}/lessons/create`}>
                      <BookPlus className="mr-2 h-4 w-4" />
                      Add Lesson
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - 2/3 width on desktop */}
        <div className="lg:col-span-2">
          {/* Course content */}
          <div className="max-w-7xl mx-auto mt-12 animate-fade-in delay-2">
            <h2 className="text-2xl font-medium mb-6 tracking-tight">Course Content</h2>
            
            {sectionsWithVideoInfo.length === 0 ? (
              <div className="text-center py-12 bg-secondary/20 rounded-xl border border-border">
                <p className="text-muted-foreground">This course doesn't have any content yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <SectionList 
                  sections={sectionsWithVideoInfo}
                  courseId={courseId}
                  isOwner={isOwner}
                />
              </div>
            )}
          </div>

          {/* Course description */}
          {course.description && (
            <div className="max-w-7xl mx-auto mt-12 animate-fade-in delay-3">
              <h2 className="text-2xl font-medium mb-6 tracking-tight">About this course</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                {course.description}
              </div>
            </div>
          )}
          
          {/* Lesson Grid View (Udemy-style) */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3">Course Content</h2>
            <div className="mt-4">
              <LessonGrid 
                sections={sectionsWithVideoInfo}
                courseId={courseId}
                totalLessons={course._count?.lessons || 0}
              />
            </div>
          </div>
          
          {/* Instructor Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3">Instructor</h2>
            <Card className="p-4 md:p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 md:h-16 md:w-16 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                  {course.User?.image ? (
                    <Image 
                      src={course.User.image} 
                      alt={authorName}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  ) : (
                    <User size={32} className="text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{authorName}</h3>
                  <p className="text-muted-foreground">Course Creator</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        {/* Right column for related content on desktop */}
        <div className="space-y-6">
          {/* Course stats */}
          <Card>
            <CardContent className="p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4">Course Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>{course._count?.lessons || 0} lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <span>{course._count?.enrollments || 0} students enrolled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Last updated {timeAgo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>English</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 