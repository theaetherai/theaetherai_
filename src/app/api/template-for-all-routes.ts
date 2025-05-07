/**
 * TEMPLATE FOR API ROUTES
 * 
 * This is a template file for creating minimal test versions of API routes
 * to help get past build errors. Copy and adapt this for each API route.
 * 
 * STEPS TO USE:
 * 1. Replace imports with just NextResponse
 * 2. Copy the relevant function templates below based on HTTP methods needed
 * 3. Adjust parameter patterns as needed for your route
 * 4. Modify response data if needed
 */

import { NextResponse } from "next/server"

function isValidUUID(uuid: string | undefined) {
  return typeof uuid === 'string' && /^[0-9a-fA-F-]{36}$/.test(uuid)
}

// --------- GET ROUTE TEMPLATES ---------

// Basic GET with no params
export async function GET_BASIC(req: Request) {
  console.log(`API endpoint hit ✅`)
  
  try {
    // Return a test response
    return NextResponse.json({ 
      status: 200, 
      message: "This is a test response"
    })
  } catch (error) {
    console.error('Error in minimal test route:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// GET with one param (e.g., /api/users/[id])
export async function GET_ONE_PARAM(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  console.log(`API endpoint hit ✅ id=${id}`)
  
  try {
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: `Invalid id: '${id}'` },
        { status: 400 }
      )
    }
    
    // Return a test response
    return NextResponse.json({ 
      status: 200, 
      message: "This is a test response",
      id
    })
  } catch (error) {
    console.error('Error in minimal test route:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// GET with two params (e.g., /api/courses/[courseId]/lessons/[lessonId])
export async function GET_TWO_PARAMS(
  req: Request,
  { params }: { params: { param1: string, param2: string } }
) {
  const { param1, param2 } = params
  console.log(`API endpoint hit ✅ param1=${param1}, param2=${param2}`)
  
  try {
    // Return a test response
    return NextResponse.json({ 
      status: 200, 
      message: "This is a test response",
      param1,
      param2
    })
  } catch (error) {
    console.error('Error in minimal test route:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// --------- POST ROUTE TEMPLATES ---------

// Basic POST with no params
export async function POST_BASIC(req: Request) {
  console.log(`API endpoint hit ✅`)
  
  try {
    // Return a test response
    return NextResponse.json({ 
      status: 201, 
      message: "This is a test response",
      data: { id: "new-item", createdAt: new Date().toISOString() }
    })
  } catch (error) {
    console.error('Error in minimal test route:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST with one param
export async function POST_ONE_PARAM(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  console.log(`API endpoint hit ✅ id=${id}`)
  
  try {
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: `Invalid id: '${id}'` },
        { status: 400 }
      )
    }
    
    // Return a test response
    return NextResponse.json({ 
      status: 201, 
      message: "This is a test response",
      id,
      data: { id: "new-item", createdAt: new Date().toISOString() }
    })
  } catch (error) {
    console.error('Error in minimal test route:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// --------- PUT/PATCH ROUTE TEMPLATES ---------

// PATCH with params
export async function PATCH_WITH_PARAMS(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  console.log(`API endpoint hit ✅ id=${id}`)
  
  try {
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: `Invalid id: '${id}'` },
        { status: 400 }
      )
    }
    
    // Return a test response
    return NextResponse.json({ 
      status: 200, 
      message: "This is a test response",
      id,
      data: { id, updatedAt: new Date().toISOString() }
    })
  } catch (error) {
    console.error('Error in minimal test route:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// --------- DELETE ROUTE TEMPLATES ---------

// DELETE with params
export async function DELETE_WITH_PARAMS(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  console.log(`API endpoint hit ✅ id=${id}`)
  
  try {
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: `Invalid id: '${id}'` },
        { status: 400 }
      )
    }
    
    // Return a test response
    return NextResponse.json({ 
      status: 200, 
      message: "Item deleted successfully",
      id
    })
  } catch (error) {
    console.error('Error in minimal test route:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
} 