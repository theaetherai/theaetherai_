import { PrismaClient } from '@prisma/client'
import { retry } from '@/lib/utils'

// Create a singleton Prisma client instance
const globalForPrisma = global as unknown as { 
  prisma: PrismaClient 
}

// Connection retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000 // Start with 1 second delay

// Create client with or without logs based on environment
export const client = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Add connection resilience for deployment environments
if (process.env.NODE_ENV !== 'development') {
  // Wrap Prisma client operations with retry logic
  const originalPrismaCall = client.$connect
  
  // Override the connect method with retry logic
  client.$connect = async () => {
    try {
      return await retry(
        () => originalPrismaCall.apply(client), 
        MAX_RETRIES, 
        RETRY_DELAY_MS,
        (error: Error) => console.error("Database connection error:", error)
      )
    } catch (error) {
      console.error("Failed to connect to database after multiple retries:", error)
      // Still throw the error so application code can handle it appropriately
      throw error
    }
  }
}

// Only set the global client in non-test environments
if (process.env.NODE_ENV !== 'test') {
  globalForPrisma.prisma = client
}
