import { NextRequest, NextResponse } from 'next/server'
import { apiSuccess, apiError } from '@/lib/api-response'
import { auth } from '@clerk/nextjs/server'
import { safeCourseAccess, hasUserSession } from '@/lib/safe-auth'
import { client } from '@/lib/prisma'

/**
 * Utility API endpoint to check if another API route exists
 * This is useful for feature detection on the client side
 * Can only be used by authenticated users
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    
    // Only allow authenticated users to check routes
    if (!userId) {
      return apiError('Unauthorized', 401)
    }
    
    const { route } = await req.json()
    
    if (!route) {
      return apiError('Route parameter is required', 400)
    }
    
    // Allow checking both API routes and page routes
    const isApiRoute = route.startsWith('/api/')
    
    // Try to access the route with a HEAD request
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const routeUrl = new URL(route, baseUrl)
      
      const response = await fetch(routeUrl.toString(), {
        method: 'HEAD',
        headers: {
          'Authorization': req.headers.get('Authorization') || '',
          'Cache-Control': 'no-cache'
        }
      })
      
      // For API routes, we expect a proper status code
      // For page routes, a 404 means the route doesn't exist
      const exists = isApiRoute 
        ? response.status !== 404 && response.status < 500
        : response.status !== 404
      
      return apiSuccess({
        exists,
        status: response.status,
        route,
        type: isApiRoute ? 'api' : 'page'
      })
    } catch (error) {
      console.error('Error verifying route:', error)
      
      // Return a more detailed error response
      return apiSuccess({
        exists: false,
        error: 'Failed to connect to route',
        route,
        type: isApiRoute ? 'api' : 'page',
        errorDetail: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } catch (error) {
    console.error('Error in verify-route API:', error)
    return apiError('Internal server error', 500)
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';
  const checkDb = searchParams.get('check_db') === 'true';
  
  // If check_db parameter is true, perform database check
  if (checkDb) {
    try {
      // Try a simple database query
      await client.$connect();
      
      // Run a simple query to verify database is working
      // Just count users which is a lightweight operation
      await client.user.count();
      
      return NextResponse.json({ 
        status: 'ok',
        message: 'Database connection successful',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Database verification failed:', error);
      
      // Return 503 Service Unavailable for database connection issues
      return NextResponse.json({ 
        status: 'error',
        message: 'Database connection failed',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    } finally {
      // Always disconnect after checking
      await client.$disconnect().catch(console.error);
    }
  }
  
  // Default behavior - check auth status
  try {
    // Check Clerk auth directly
    const clerkAuth = auth();
    
    // Check safe auth implementation
    const safeAuth = await safeCourseAccess();
    
    // Check session cookies
    const hasCookies = hasUserSession();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      path,
      clerk: {
        userId: clerkAuth.userId,
        sessionId: clerkAuth.sessionId,
      },
      safeAuth: {
        authenticated: safeAuth.authenticated,
        hasFallback: Boolean(safeAuth.fallback),
        hasUser: Boolean(safeAuth.user),
      },
      cookies: {
        hasSession: hasCookies
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Authentication check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      path
    }, { status: 500 });
  }
} 