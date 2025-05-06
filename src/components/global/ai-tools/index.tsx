'use client'

import { Button } from '@/components/ui/button'
import { TabsContent } from '@/components/ui/tabs'
import React from 'react'
import Loader from '../loader'

import {
  Bot,
  DownloadIcon,
  FileTextIcon,
  Pencil,
  StarsIcon,
  VideoIcon,
} from 'lucide-react'
import Link from 'next/link'

type Props = {
  plan: 'PRO' | 'FREE'
  trial: boolean
  videoId: string
}

const AiTools = ({ plan, trial, videoId }: Props) => {
  //Are they on a free plan?
  //have they already tried the AI feature?
  //if not? Try button
  
  // useMutationData
  //serveraction titles and description

  //WIP: setup the ai hook
  return (
    <TabsContent value="Ai tools">
      <div className="p-5  rounded-xl flex flex-col gap-y-6 ">
        <div className="flex items-center gap-4">
          <div className="w-full bg-[#f7f9fa]">
            <h2 className="text-3xl font-bold"> Ai Tools</h2>
            <p className="text-[#BDBDBD] ">
              Taking your video to the next step with the power of AI!
            </p>
          </div>

          <div className="flex gap-4 w-full justify-end">
            <Button className=" mt-2 text-sm bg-[#f7f9fa] text-[#2d2f31]">
              <Loader
                state={false}
                color="#000"
              >
                Try now
              </Loader>
            </Button>
            {/* WIP: Pay button  */}
           
            {/* <Button className=" mt-2 text-sm">
            <Loader
              state={false}
              color="#000"
            >
              Generate Now
            </Loader>
          </Button> */}
          </div>
        </div>
        <div className=" border-[1px] rounded-xl p-4 gap-4 flex flex-col bg-[#f7f9fa] ">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-[#a22fe0]"> Gin Ai</h2>
            <StarsIcon
              color="#a22fe0"
              fill="#a22fe0"
            />
          </div>
          <div className="flex gap-2 items-start">
            <div className="p-2 rounded-full border-[#2d2d2d] border-[2px] bg-[#2b2b2b] ">
              <Pencil color="#a22fe0" />
            </div>
            <div className="flex flex-col">
              <h3 className="textmdg">Summary</h3>
              <p className="text-muted-foreground text-sm">
                Generate a description for your video using AI.
              </p>
            </div>
          </div>
          
          
          <Link href={`/ai-tutor?videoId=${videoId}`}>
            <div className="flex gap-2 items-start cursor-pointer hover:bg-[#2b2b2b] p-2 rounded-md transition-colors">
              <div className="p-2 rounded-full border-[#2d2d2d] border-[2px] bg-[#2b2b2b] ">
                <Bot color="#a22fe0" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-md">AI Tutor</h3>
                <p className="text-muted-foreground text-sm">
                  Ask questions about this video and get personalized explanations from our AI tutor.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </TabsContent>
  )
}

export default AiTools
