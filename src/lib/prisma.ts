import { PrismaClient } from '@prisma/client'
import { retry } from '../lib/utils'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting the database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { 
  prisma: PrismaClient 
}

// Connection retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000 // Start with 1 second delay

export const client = globalForPrisma.prisma || 
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
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
if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV === 'development') {
  globalForPrisma.prisma = client
}
