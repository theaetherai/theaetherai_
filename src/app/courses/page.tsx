import { onAuthenticateUser } from '@/actions/user'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { client } from '@/lib/prisma'
import { safeCourseAccess } from '@/lib/safe-auth'
import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CourseGrid from '@/components/courses/course-grid'
import { BookPlus, ChevronRight, GraduationCap, Search } from 'lucide-react'
import { Suspense } from 'react'
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query'
import { Course, Enrollment, User } from '@prisma/client'

// Define types
type DbUser = {
  id: string;
  [key: string]: any;
};

type ExtendedCourse = Course & {
  User: {
    firstname: string | null;
    lastname: string | null;
    image: string | null;
  } | null;
  _count: {
    lessons: number;
    enrollments: number;
  };
  isEnrolled?: boolean;
  isOwner?: boolean;
  currentUserId?: string;
};

type EnrollmentWithCourse = Enrollment & {
  Course: ExtendedCourse | null;
};

export default async function CoursesPage() {
  // Use safer auth check without forcing redirect
  const authResult = await safeCourseAccess();
  console.log('[COURSES_PAGE] Auth check result:', authResult.authenticated ? 'authenticated' : 'public access');
  
  let dbUser: any = null;
  let formattedEnrolledCourses: any[] = [];
  let formattedCreatedCourses: any[] = [];
  
  // Only fetch user-specific data if authenticated
  if (authResult.authenticated && authResult.user) {
    // Get user data from database
    const auth = await onAuthenticateUser();
    if (auth.status === 200 || auth.status === 201) {
      dbUser = auth.user;
      
      // Get user's created courses
      const createdCourses = await client.course.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: 'desc' },
        include: {
          User: {
            select: {
              firstname: true,
              lastname: true,
              image: true
            }
          },
          _count: {
            select: {
              lessons: true,
              enrollments: true
            }
          }
        }
      });

      // Get user's enrolled courses
      const enrolledCourses = await client.enrollment.findMany({
        where: { userId: dbUser.id },
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
              _count: {
                select: {
                  lessons: true,
                  enrollments: true
                }
              }
            }
          }
        }
      });

      // Format enrolled courses to match expected structure
      formattedEnrolledCourses = enrolledCourses
        .filter(enrollment => enrollment.Course) // Filter out any null courses
        .map(enrollment => ({
          ...enrollment.Course!,
          isEnrolled: true,
          currentUserId: dbUser.id
        }));

      // Format created courses to match expected structure
      formattedCreatedCourses = createdCourses.map(course => ({
        ...course,
        isOwner: true,
        currentUserId: dbUser.id
      }));
    }
  }
  
  // Get all public courses for non-authenticated users
  const publicCourses = await client.course.findMany({
    where: {
      published: true
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      User: {
        select: {
          firstname: true,
          lastname: true,
          image: true
        }
      },
      _count: {
        select: {
          lessons: true,
          enrollments: true
        }
      }
    }
  });

  // This is a workaround for TypeScript issues
  // The component that uses these courses expects a specific interface
  // We're manually transforming our data to match the expected type
  const courseGridCompatibleData = (courses: any[]) => {
    return courses.map(course => ({
      ...course,
      thumbnailUrl: course.thumbnailUrl || undefined,
    }))
  };

  // Apply compatibility transform to all course data
  const compatiblePublicCourses = courseGridCompatibleData(publicCourses);
  const compatibleEnrolledCourses = courseGridCompatibleData(formattedEnrolledCourses);
  const compatibleCreatedCourses = courseGridCompatibleData(formattedCreatedCourses);

  const queryClient = new QueryClient();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {authResult.authenticated ? "My Courses" : "Explore Courses"}
          </h1>
          <p className="text-muted-foreground">
            {authResult.authenticated 
              ? "Manage your learning journey" 
              : "Discover learning opportunities"}
          </p>
        </div>
        
        <div className="flex gap-4">
          {authResult.authenticated ? (
            <>
              <Link href="/home">
                <Button variant="outline" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Explore Courses
                </Button>
              </Link>
              
              <Link href="/courses/create">
                <Button className="flex items-center gap-2">
                  <BookPlus className="h-4 w-4" />
                  Create Course
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/sign-in">
                <Button variant="outline" className="flex items-center gap-2">
                  Sign In
                </Button>
              </Link>
              
              <Link href="/auth/sign-up">
                <Button className="flex items-center gap-2">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
      
      {authResult.authenticated ? (
        <Tabs defaultValue="enrolled" className="mt-6">
          <div className="flex w-full justify-between items-center">
            <TabsList className="bg-transparent gap-2 pl-0">
              <TabsTrigger 
                className="p-[13px] px-6 rounded-full data-[state=active]:bg-[#252525]"
                value="enrolled"
              >
                Enrolled Courses
              </TabsTrigger>
              <TabsTrigger 
                className="p-[13px] px-6 rounded-full data-[state=active]:bg-[#252525]"
                value="created"
              >
                My Created Courses
              </TabsTrigger>
              <TabsTrigger 
                className="p-[13px] px-6 rounded-full data-[state=active]:bg-[#252525]"
                value="all"
              >
                All Courses
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="enrolled" className="mt-6">
            <Suspense fallback={<div>Loading enrolled courses...</div>}>
              <HydrationBoundary state={dehydrate(queryClient)}>
                {compatibleEnrolledCourses.length > 0 ? (
                  <CourseGrid 
                    courses={compatibleEnrolledCourses}
                    title="Enrolled Courses"
                    showFilters={false}
                  />
                ) : (
                  <div className="text-center py-12 border border-dashed border-border rounded-lg">
                    <h3 className="text-xl font-semibold mb-2">You haven't enrolled in any courses yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Explore our catalog and start learning today
                    </p>
                    <Link href="/home">
                      <Button>
                        Browse Courses
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </HydrationBoundary>
            </Suspense>
          </TabsContent>
          
          <TabsContent value="created" className="mt-6">
            <Suspense fallback={<div>Loading your courses...</div>}>
              <HydrationBoundary state={dehydrate(queryClient)}>
                {compatibleCreatedCourses.length > 0 ? (
                  <CourseGrid 
                    courses={compatibleCreatedCourses}
                    title="My Created Courses"
                    showFilters={false}
                  />
                ) : (
                  <div className="text-center py-12 border border-dashed border-border rounded-lg">
                    <h3 className="text-xl font-semibold mb-2">You haven't created any courses yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Share your knowledge by creating educational content
                    </p>
                    <Link href="/courses/create">
                      <Button>
                        Create Your First Course
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </HydrationBoundary>
            </Suspense>
          </TabsContent>
          
          <TabsContent value="all" className="mt-6">
            <Suspense fallback={<div>Loading courses...</div>}>
              <HydrationBoundary state={dehydrate(queryClient)}>
                <CourseGrid 
                  courses={compatiblePublicCourses}
                  title="All Available Courses"
                  showFilters={true}
                />
              </HydrationBoundary>
            </Suspense>
          </TabsContent>
        </Tabs>
      ) : (
        // Public view - just show available courses
        <div className="mt-6">
          <Suspense fallback={<div>Loading courses...</div>}>
            <HydrationBoundary state={dehydrate(queryClient)}>
              <CourseGrid 
                courses={compatiblePublicCourses}
                title="Available Courses"
                showFilters={true}
              />
            </HydrationBoundary>
          </Suspense>
        </div>
      )}
    </div>
  )
} 