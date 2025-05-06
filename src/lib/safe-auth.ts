import { currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

/**
 * A safer version of Clerk's currentUser that includes error handling
 * to prevent server component crashes when Clerk API has issues
 */
export async function safeCurrentUser() {
  try {
    // Set a timeout to prevent hanging if Clerk is slow
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Clerk authentication timed out")), 5000);
    });

    // Race against the timeout
    const user = await Promise.race([
      clerkCurrentUser(),
      timeoutPromise
    ]) as Awaited<ReturnType<typeof clerkCurrentUser>>;
    
    console.log("[SAFE_AUTH] Current user retrieved successfully:", user?.id || "null");
    return user;
  } catch (error) {
    console.error("[SAFE_AUTH] Error in safe currentUser:", error);
    
    // Even if Clerk API fails, we check for cookies to provide a fallback mechanism
    const hasCookies = hasUserSession();
    console.log("[SAFE_AUTH] User session cookies present:", hasCookies);
    
    // Return null to indicate no authenticated user
    return null;
  }
}

/**
 * Checks if a user session exists by examining cookies
 * This is a fallback when Clerk API might be unavailable
 */
export function hasUserSession() {
  try {
    const cookieStore = cookies();
    const hasClerkCookie = cookieStore.getAll().some(cookie => 
      cookie.name.startsWith('__clerk') || 
      cookie.name.startsWith('__session')
    );
    
    return hasClerkCookie;
  } catch (error) {
    console.error("[SAFE_AUTH] Error checking for user session:", error);
    return false;
  }
}

/**
 * Special version for course access that prevents redirection
 * when authentication fails temporarily
 */
export async function safeCourseAccess() {
  try {
    const user = await safeCurrentUser();
    if (user) {
      return { authenticated: true, user };
    }
    
    // If no user but has cookies, assume temp auth failure
    if (hasUserSession()) {
      console.log("[SAFE_AUTH] Cookies present but no user - allowing temporary course access");
      return { authenticated: true, user: null, fallback: true };
    }
    
    return { authenticated: false };
  } catch (error) {
    console.error("[SAFE_AUTH] Course access error:", error);
    return { authenticated: false, error };
  }
} 