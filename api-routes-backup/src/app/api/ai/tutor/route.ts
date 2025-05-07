import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Minimal test route to debug build issues
export async function POST(req: Request) {
  try {
    console.log("AI Tutor endpoint hit");
    
    // Only include auth check as it's fundamental
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Return a simple response without accessing any external services
    return NextResponse.json({ 
      status: "ok",
      message: "This is a test response from the AI tutor endpoint" 
    });
    
  } catch (error) {
    console.error("Error in minimal test route:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 