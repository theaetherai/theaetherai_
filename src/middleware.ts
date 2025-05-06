// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000']

// const isProtectedRoutes = createRouteMatcher(['/dashboard(.*)', '/payment(.*)'])
// export default clerkMiddleware(async (auth, req) => {
//   if (isProtectedRoutes(req)) {
//     auth().protect()
//   }
// })

// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
//     // Always run for API routes
//     '/(api|trpc)(.*)',
//   ],
// }

import { authMiddleware, redirectToSignIn } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { client } from './lib/prisma'

// Define public routes
const publicRoutes = [
  '/',
  '/home',
  '/courses',
  '/courses/(.*)',
  '/preview/(.*)',
  '/api/(.*)',
  '/auth/sign-in/(.*)',
  '/auth/sign-up/(.*)',
  '/auth/callback/(.*)',
  '/typography',
  '/design-system/(.*)',
  '/payment',
  '/verify-route',
  '/db-error'
]

// Check if the database is reachable
async function checkDatabaseConnection() {
  try {
    await client.$connect()
    await client.$disconnect()
    return true
  } catch (error) {
    console.error('Database connection check failed:', error)
    return false
  }
}

// Function to check if a path is a public route
function isPathPublic(pathname: string): boolean {
  return publicRoutes.some(route => {
    if (route.includes('(.*)')) {
      const baseRoute = route.replace('(.*)', '')
      return pathname.startsWith(baseRoute)
    }
    return route === pathname
  }) || 
  pathname.startsWith('/api/auth/') || 
  pathname.startsWith('/db-error')
}

// This middleware handles database connectivity issues and authentication
export default authMiddleware({
  publicRoutes,
  
  beforeAuth: async (req) => {
    // Skip database check for static assets and media files
    const path = req.nextUrl.pathname
    if (
      path.includes('/_next') ||
      path.includes('/favicon') ||
      path.includes('/api/auth') ||
      path.endsWith('.svg') || 
      path.endsWith('.jpg') || 
      path.endsWith('.png') || 
      path.endsWith('.ico')
    ) {
      return NextResponse.next()
    }

    // Check if database is accessible in production
    if (process.env.NODE_ENV === 'production') {
      const isDbConnected = await checkDatabaseConnection()
      
      // Handle database connection issues
      if (!isDbConnected && !path.startsWith('/db-error')) {
        if (path.startsWith('/api/')) {
          // For API routes, return a proper JSON error
          return NextResponse.json(
            { 
              error: 'Database connection error', 
              message: 'Unable to connect to the database at this time. Please try again later.'
            }, 
            { status: 503 }
          )
        } else if (!path.includes('/auth/')) {
          // For regular routes, redirect to error page (but not for auth pages)
          const url = req.nextUrl.clone()
          url.pathname = '/db-error'
          return NextResponse.rewrite(url)
        }
      }
    }

    return NextResponse.next()
  },
  
  afterAuth(auth, req) {
    if (!auth.userId && !isPathPublic(req.nextUrl.pathname)) {
      return redirectToSignIn({ returnBackUrl: req.url })
    }
    return NextResponse.next()
  }
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}