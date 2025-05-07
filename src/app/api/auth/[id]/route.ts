import { client } from '../../../../lib/prisma'
import { clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params: { id } }: { params: { id: string } }
) {
  console.log('Endpoint hit ✅')

  try {
    // Check for required env vars
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not set')
      return NextResponse.json({ error: 'DATABASE_URL is not set' }, { status: 500 })
    }

    let userProfile = null
    try {
      userProfile = await client.user.findUnique({
        where: {
          clerkid: id,
        },
        include: {
          studio: true,
          subscription: {
            select: {
              plan: true,
            },
          },
        },
      })
    } catch (dbFindError) {
      console.error('DB Find Error:', dbFindError)
      return NextResponse.json({ error: 'Database error during user lookup' }, { status: 500 })
    }

    if (userProfile)
      return NextResponse.json({ status: 200, user: userProfile })

    let clerkUserInstance = null
    try {
      clerkUserInstance = await clerkClient.users.getUser(id)
    } catch (clerkError) {
      console.error('Clerk Error:', clerkError)
      return NextResponse.json({ error: 'Clerk user fetch error' }, { status: 500 })
    }

    let createUser = null
    try {
      createUser = await client.user.create({
        data: {
          clerkid: id,
          email: clerkUserInstance.emailAddresses[0].emailAddress,
          firstname: clerkUserInstance.firstName,
          lastname: clerkUserInstance.lastName,
          studio: {
            create: {},
          },
          workspace: {
            create: {
              name: `${clerkUserInstance.firstName}'s Workspace`,
              type: 'PERSONAL',
            },
          },
          subscription: {
            create: {},
          },
        },
        include: {
          subscription: {
            select: {
              plan: true,
            },
          },
        },
      })
    } catch (dbCreateError) {
      console.error('DB Create Error:', dbCreateError)
      return NextResponse.json({ error: 'Database error during user creation' }, { status: 500 })
    }

    if (createUser) return NextResponse.json({ status: 201, user: createUser })

    return NextResponse.json({ status: 400, error: 'User could not be created or found' })
  } catch (error) {
    console.error('Server Error in /api/auth/[id]:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
