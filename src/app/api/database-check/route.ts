import { NextResponse } from 'next/server';
import { client } from '@/lib/prisma';

export async function GET() {
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