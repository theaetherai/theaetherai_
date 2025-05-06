import { client } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import React from 'react'
import ChatInterface from '@/components/ai-tutor/chat-interface'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function AiTutorPage({
  searchParams,
}: {
  searchParams: { videoId?: string }
}) {
  // PRO subscription check
  const user = await currentUser()
  const userRecord = await client.user.findUnique({
    where: { clerkid: user?.id },
    select: {
      subscription: {
        select: { plan: true }
      }
    }
  })

  const isPro = userRecord?.subscription?.plan === 'PRO'
  if (!isPro && user) {
    return redirect('/dashboard')
  }

  // Get video title if videoId is provided
  let videoTitle = undefined
  const { videoId } = searchParams
  
  if (videoId) {
    const video = await client.video.findUnique({
      where: { id: videoId },
      select: { 
        title: true,
        workSpaceId: true 
      }
    })
    videoTitle = video?.title as string
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        {videoId && videoTitle && (
          <div className="mb-4">
            <Link href={`/preview/${videoId}`}>
              <Button variant="ghost" className="flex items-center gap-2 px-0 text-[#9D9D9D] hover:text-white">
                <ArrowLeft size={16} />
                <span>Back to video: {videoTitle}</span>
              </Button>
            </Link>
          </div>
        )}
        
        <h1 className="text-3xl font-bold text-white mb-2">AI Tutor</h1>
        <p className="text-[#9D9D9D]">
          Ask questions about educational content and get personalized explanations
        </p>
      </div>
      
      <ChatInterface videoId={videoId} videoTitle={videoTitle} />
    </div>
  )
} 