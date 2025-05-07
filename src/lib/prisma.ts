import { PrismaClient } from '@prisma/client'
import { retry } from '../lib/utils'

/**
 * PrismaClient is attached to the `global` object in development to prevent
 * exhausting the database connection limit.
 * Learn more: https://pris.ly/d/help/next-js-best-practices
 */

const globalForPrisma = global as unknown as { 
  prisma: PrismaClient 
}

/**
 * Function that creates a Prisma client instance.
 * This is used to avoid connection during build time and only connect when needed.
 */
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  })
}

// Use existing client on global in development, or create a new one that doesn't connect immediately
export const client = globalForPrisma.prisma || createPrismaClient()

// Only set the global client in non-test environments and development
if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV === 'development') {
  globalForPrisma.prisma = client
}

// Add connection resilience for deployment environments
if (process.env.NODE_ENV !== 'development') {
  // Wrap Prisma client operations with retry logic
  const originalPrismaCall = client.$connect
  
  // Override the connect method with retry logic
  client.$connect = async () => {
    try {
      return await retry(
        () => originalPrismaCall.apply(client), 
        3, // MAX_RETRIES
        1000, // RETRY_DELAY_MS
        (error: Error) => console.error("Database connection error:", error)
      )
    } catch (error) {
      console.error("Failed to connect to database after multiple retries:", error)
      // Still throw the error so application code can handle it appropriately
      throw error
    }
  }
}

/**
 * Helper function to get a Prisma client instance
 * Use this in API routes instead of importing client directly
 */
export async function getPrisma() {
  try {
    // Only actually connect when we need to
    // This prevents connection during build time
    return client
  } catch (e) {
    console.error("Failed to get Prisma client:", e)
    throw new Error("Database connection failed")
  }
}
