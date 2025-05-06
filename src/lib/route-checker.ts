import axios from 'axios'

const routeCache = new Map<string, boolean>()

/**
 * Checks if an API route exists using the verify-route API
 * Uses caching to avoid repeated checks for the same route
 * 
 * @param route The API route to check (must start with /api/)
 * @returns A boolean indicating if the route exists
 */
export async function checkIfRouteExists(route: string): Promise<boolean> {
  // Return from cache if we've checked this route before
  if (routeCache.has(route)) {
    return routeCache.get(route) as boolean
  }
  
  try {
    const response = await axios.post('/api/verify-route', { route })
    
    // Cache the result
    const exists = response.data?.data?.exists === true
    routeCache.set(route, exists)
    
    return exists
  } catch (error) {
    console.error('Error checking route existence:', error)
    return false
  }
}

/**
 * A wrapper for functions that interact with API routes that might not exist
 * If the route doesn't exist, the fallback function is called instead
 * 
 * @param route The API route to check
 * @param apiFunction The function to call if the route exists
 * @param fallbackFunction The function to call if the route doesn't exist
 * @returns The result of either apiFunction or fallbackFunction
 */
export async function withRouteCheck<T>(
  route: string,
  apiFunction: () => Promise<T>,
  fallbackFunction: () => T | Promise<T>
): Promise<T> {
  const routeExists = await checkIfRouteExists(route)
  
  if (routeExists) {
    return apiFunction()
  } else {
    return fallbackFunction()
  }
} 