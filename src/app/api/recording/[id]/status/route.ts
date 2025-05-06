import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const url = new URL(req.url);
    const filename = url.searchParams.get("filename");

    console.log(`Checking status for user ID: ${userId}, filename: ${filename}`);

    if (!filename) {
      return NextResponse.json(
        { status: 400, error: "Missing filename parameter" },
        { status: 400 }
      );
    }
    
    // The ID is now the database UUID, so we can use it directly
    try {
      // Find the video by user ID and filename
      const video = await client.video.findFirst({
        where: {
          userId: userId,
          source: { contains: filename }
        },
        select: {
          id: true,
          processing: true,
          source: true
        }
      });

      if (!video) {
        console.log(`No video record found for ${filename}`);
        return NextResponse.json({
          status: 200,
          completed: false,
          message: "No video record found"
        });
      }

      // If the source doesn't match the filename exactly, it may have been updated to a URL
      const hasBeenUpdated = video.source !== filename;
      
      return NextResponse.json({
        status: 200,
        completed: !video.processing && hasBeenUpdated,
        url: hasBeenUpdated ? video.source : null
      });
    } catch (error: any) {
      console.error(`Database error: ${error.message}`);
      return NextResponse.json(
        { status: 500, error: error.message || "Database error" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error(`General error: ${error.message}`);
    return NextResponse.json(
      { status: 500, error: error.message || "Server error" },
      { status: 500 }
    );
  }
} 