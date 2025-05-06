import { onAuthenticateUser } from '@/actions/user'
import { currentUser } from '@clerk/nextjs/server'
import { client } from '@/lib/prisma'
import React from 'react'
import CourseSearch from '@/components/courses/course-search'
import CourseGrid from '@/components/courses/course-grid'
import { Suspense } from 'react'
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'

interface HomePageProps {
  searchParams: {
    q?: string
    sortBy?: string
    enrolled?: string
    created?: string
    page?: string
    limit?: string
  }
}

// Component to display when database connection fails
const DatabaseConnectionError = () => (
  <Alert variant="destructive" className="mb-6">
    <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
    <AlertTitle>Database Connection Error</AlertTitle>
    <AlertDescription>
      We're having trouble connecting to our database. Please try again later or contact support if the problem persists.
    </AlertDescription>
  </Alert>
)

export default async function HomePage({ searchParams }: HomePageProps) {
  // Try to get current user without forcing redirect
  const user = await currentUser()
  let dbUser = null;
  let dbConnectionError = false;

  // Only get DB user if authenticated
  if (user) {
    try {
      dbUser = await client.user.findUnique({
        where: { clerkid: user.id },
        select: { id: true }
      })
    } catch (error) {
      console.error("Database connection error:", error);
      dbConnectionError = true;
      // Continue with null dbUser
    }
  }

  // Parse search parameters
  const query = searchParams.q || ''
  const sortBy = searchParams.sortBy || 'newest'
  const enrolled = searchParams.enrolled === 'true'
  const created = searchParams.created === 'true'
  const page = parseInt(searchParams.page || '1')
  const limit = parseInt(searchParams.limit || '20')

  // Build where conditions for the query
  let whereConditions: any = {}

  // Add search filter
  if (query) {
    whereConditions.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } }
    ]
  }

  // Filter by enrollment if requested (only if user is logged in)
  if (enrolled && dbUser) {
    whereConditions.enrollments = {
      some: {
        userId: dbUser.id
      }
    }
  }

  // Filter by created courses if requested (only if user is logged in)
  if (created && dbUser) {
    whereConditions.userId = dbUser.id
  }

  // Determine sort order
  let orderBy: any = {}
  switch (sortBy) {
    case 'oldest':
      orderBy.createdAt = 'asc'
      break
    case 'popular':
      orderBy.enrollments = { _count: 'desc' }
      break
    case 'alphabetical':
      orderBy.title = 'asc'
      break
    case 'newest':
    default:
      orderBy.createdAt = 'desc'
      break
  }

  // Get courses with error handling
  let courses: any[] = [];
  try {
    courses = await client.course.findMany({
      where: {
        ...whereConditions,
        published: true
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
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
        },
        enrollments: dbUser ? {
          where: {
            userId: dbUser.id
          },
          take: 1
        } : undefined
      }
    })
  } catch (error) {
    console.error("Database query error:", error);
    dbConnectionError = true;
    // Continue with empty courses array
  }

  // Add isEnrolled, currentUserId, and Udemy-style fields to each course
  const coursesWithMetadata = courses.map(course => ({
    ...course,
    isEnrolled: dbUser ? (course.enrollments?.length > 0) : false,
    currentUserId: dbUser?.id || undefined,
    enrollments: undefined, // Remove enrollments from response
    bestseller: course.bestseller,
    price: course.price ? Number(course.price) : undefined,
    discountPrice: course.discountPrice ? Number(course.discountPrice) : undefined,
    category: course.category ?? undefined,
    level: course.level ?? undefined,
    thumbnailUrl: course.thumbnailUrl ?? undefined
  }))

  const queryClient = new QueryClient()

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 relative">
      {/* Enhanced background decoration elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl opacity-80 animate-float pointer-events-none z-0"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl opacity-70 animate-float delay-3 pointer-events-none z-0"></div>
      <div className="absolute -bottom-10 right-40 w-72 h-72 bg-secondary/10 rounded-full blur-3xl opacity-70 animate-float delay-5 pointer-events-none z-0"></div>
      
      {/* Content container with enhanced visuals */}
      <div className="relative z-10 p-8 rounded-xl border-2 border-border/70 bg-gradient-to-b from-background/95 to-background shadow-elevation-3 mb-10 animate-fade-in">
        <h1 className="text-4xl font-bold text-foreground mb-3">Explore Courses</h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-2xl">
          Discover educational content and enhance your learning journey with expert-led courses
        </p>
        
        {dbConnectionError && <DatabaseConnectionError />}
        
        <CourseSearch />
      </div>
      
      <Suspense fallback={
        <div className="p-10 rounded-xl border-2 border-border/40 bg-card/50 text-center animate-pulse">
          <div className="inline-block p-4 rounded-full bg-primary/10 mb-6 animate-spin">
            <svg className="h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-foreground font-medium text-lg">Loading courses...</p>
          <p className="text-muted-foreground mt-2">Please wait while we prepare your content</p>
        </div>
      }>
        <div className="relative z-10 p-8 rounded-xl border-2 border-border/70 bg-gradient-to-b from-background/95 to-background/80 shadow-elevation-3 animate-fade-in delay-1">
          {dbConnectionError ? (
            <div className="text-center py-8">
              <h3 className="text-xl font-semibold mb-4">Database Connection Issue</h3>
              <p className="text-muted-foreground mb-6">We're unable to load courses at the moment due to a database connection issue.</p>
              <p className="text-sm">Please try refreshing the page or check back later.</p>
            </div>
          ) : (
            <HydrationBoundary state={dehydrate(queryClient)}>
              <CourseGrid 
                courses={coursesWithMetadata}
                title={query ? `Search Results for "${query}"` : "All Courses"}
                showFilters={false}
              />
            </HydrationBoundary>
          )}
        </div>
      </Suspense>
    </div>
  )
} 