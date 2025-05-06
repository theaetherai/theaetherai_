import { resilientCurrentUser, cacheUserSession, getCachedUserSession, logAuthError } from '@/lib/auth-resilience';
import { client } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { unstable_noStore as noStore } from 'next/cache';

// Local session cookie name
const LOCAL_SESSION_COOKIE = 'opal_session';

// Enhanced version of onAuthenticateUser that won't disrupt the flow
export const resilientAuthenticateUser = async () => {
  // Prevent caching to avoid headers issues
  noStore();
  
  try {
    // Step 1: Try to get authenticated user with our resilient function
    const user = await resilientCurrentUser();
    
    // Step 2: If no user from Clerk, try local fallback
    if (!user) {
      console.log("No Clerk user, checking local session...");
      const localSession = getLocalSession();
      
      // If we have a local session, use it as fallback
      if (localSession?.clerkid) {
        console.log("Using locally cached session");
        
        // Try to get user from database using cached Clerk ID
        try {
          const cachedUser = await client.user.findUnique({
            where: {
              clerkid: localSession.clerkid,
            },
            include: {
              workspace: {
                where: {
                  User: {
                    clerkid: localSession.clerkid,
                  },
                },
              },
            },
          });
          
          if (cachedUser) {
            // Return cached user with fallback flag
            return { 
              status: 200, 
              user: cachedUser,
              usingFallback: true 
            };
          }
        } catch (dbError) {
          logAuthError("Database lookup for cached session", dbError);
        }
      }
      
      // If we reach here, we couldn't authenticate via Clerk or fallbacks
      // But instead of returning 403, we'll return a special status
      return { status: 299, message: "Authentication degraded" };
    }
    
    // Step 3: Normal flow - user exists from Clerk
    try {
      const userExist = await client.user.findUnique({
        where: {
          clerkid: user.id,
        },
        include: {
          workspace: {
            where: {
              User: {
                clerkid: user.id,
              },
            },
          },
        },
      });
      
      if (userExist) {
        // Store in local session for fallback
        saveLocalSession({
          clerkid: user.id,
          timestamp: Date.now()
        });
        
        // Cache for in-memory fallback
        cacheUserSession(user.id, userExist);
        
        return { status: 200, user: userExist };
      }
      
      // User doesn't exist in our DB yet, create them
      const newUser = await client.user.create({
        data: {
          clerkid: user.id,
          email: user.emailAddresses[0].emailAddress,
          firstname: user.firstName,
          lastname: user.lastName,
          image: user.imageUrl,
          studio: {
            create: {},
          },
          subscription: {
            create: {},
          },
          workspace: {
            create: {
              name: `${user.firstName}'s Workspace`,
              type: 'PERSONAL',
            },
          },
        },
        include: {
          workspace: {
            where: {
              User: {
                clerkid: user.id,
              },
            },
          },
          subscription: {
            select: {
              plan: true,
            },
          },
        },
      });
      
      if (newUser) {
        // Store in local session for fallback
        saveLocalSession({
          clerkid: user.id,
          timestamp: Date.now()
        });
        
        return { status: 201, user: newUser };
      }
      
      return { status: 400 };
    } catch (dbError) {
      logAuthError("Database operation in authenticate", dbError);
      
      // Instead of failing, return degraded status
      return { status: 298, message: "Database error, using degraded mode" };
    }
  } catch (error) {
    logAuthError("Authentication flow", error);
    
    // Try fallback to local session as last resort
    const localSession = getLocalSession();
    if (localSession?.clerkid) {
      try {
        const fallbackUser = await client.user.findUnique({
          where: {
            clerkid: localSession.clerkid,
          },
          include: {
            workspace: {
              where: {
                User: {
                  clerkid: localSession.clerkid,
                },
              },
            },
          },
        });
        
        if (fallbackUser) {
          return { 
            status: 200, 
            user: fallbackUser,
            usingFallback: true,
            fallbackExpires: localSession.timestamp + (24 * 60 * 60 * 1000) // 24 hour validity
          };
        }
      } catch (finalError) {
        // Last resort failed, log but don't crash
        logAuthError("Final fallback attempt", finalError);
      }
    }
    
    // Return a special status rather than 500
    return { status: 297, message: "Authentication completely unavailable" };
  }
};

// Helper function to save local session in a cookie
function saveLocalSession(session: { clerkid: string, timestamp: number }) {
  try {
    const cookieStore = cookies();
    cookieStore.set({
      name: LOCAL_SESSION_COOKIE,
      value: JSON.stringify(session),
      // Short expiry - just enough for fallbacks
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
  } catch (error) {
    logAuthError("Saving local session", error);
  }
}

// Helper to get local session from cookie
function getLocalSession(): { clerkid: string, timestamp: number } | null {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(LOCAL_SESSION_COOKIE);
    
    if (!sessionCookie?.value) return null;
    
    const session = JSON.parse(sessionCookie.value);
    
    // Validate and check expiry (24 hours)
    if (!session.clerkid || !session.timestamp) return null;
    if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) return null;
    
    return session;
  } catch (error) {
    logAuthError("Getting local session", error);
    return null;
  }
} 