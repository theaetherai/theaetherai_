'use client'
import { getPreviewVideo, sendEmailForFirstView } from '@/actions/workspace'
import { useQueryData } from '@/hooks/useQueryData'
import { VideoProps } from '@/types/index.type'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo } from 'react'
import CopyLink from '../copy-link'
import RichLink from '../rich-link'
import { truncateString } from '@/lib/utils'
import { Download } from 'lucide-react'
import TabMenu from '../../tabs'
import AiTools from '../../ai-tools'
import VideoTranscript from '../../video-transcript'
import { TabsContent } from '@/components/ui/tabs'
import Activities from '../../activities'
import EditVideo from '../edit'
import VideoSummary from '../video-summary'

type Props = {
  videoId: string
}

const VideoPreview = ({ videoId }: Props) => {
  const router = useRouter()

  const { data } = useQueryData(['preview-video'], () =>
    getPreviewVideo(videoId)
  )

  const notifyFirstView = async () => await sendEmailForFirstView(videoId)

  const { data: video, status, author } = data as VideoProps
  if (status !== 200) router.push('/')

  const daysAgo = Math.floor(
    (new Date().getTime() - video.createdAt.getTime()) / (24 * 60 * 60 * 1000)
  )

  // Format description for display
  const formattedDescription = useMemo(() => {
    if (!video.description) return "";
    
    try {
      // Check if description is JSON
      const parsedData = JSON.parse(video.description as string);
      // Extract the relevant content - if aiSummary exists, use original instead
      if (parsedData.aiSummary && parsedData.original) {
        return parsedData.original || "";
      }
      // If it's a different JSON structure
      if (parsedData.summary) {
        return parsedData.summary || "";
      }
      return video.description as string;
    } catch (e) {
      // Not JSON, return as is
      return video.description as string;
    }
  }, [video.description]);

  // Get original title if it exists in JSON
  const originalTitle = useMemo(() => {
    if (!video.description) return video.title as string;
    
    try {
      const parsedData = JSON.parse(video.description as string);
      if (parsedData.original) {
        return parsedData.original;
      }
      return video.title as string;
    } catch (e) {
      return video.title as string;
    }
  }, [video.title, video.description]);

  useEffect(() => {
    if (video.views === 0) {
      notifyFirstView()
    }
    return () => {
      notifyFirstView()
    }
  }, [])

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 lg:py-10 overflow-y-auto gap-5">
      <div className="flex flex-col lg:col-span-2 gap-y-10">
        <div>
          <div className="flex gap-x-5 items-start justify-between">
            <h2 className="text-foreground text-4xl font-bold">{video.title}</h2>
            {author ? (
              <EditVideo
                videoId={videoId}
                title={originalTitle}
                description={formattedDescription}
              />
            ) : (
              <></>
            )}
          </div>
          <span className="flex gap-x-3 mt-2">
            <p className="text-[#9D9D9D] capitalize">
              {video.User?.firstname} {video.User?.lastname}
            </p>
            <p className="text-[#707070]">
              {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
            </p>
          </span>
        </div>
        <video
          preload="metadata"
          className="w-full aspect-video rounded-xl"
          controls
        >
          
          <source
            src={`${video.source}`}
          />
        </video>
        <div className="flex flex-col text-2xl gap-y-4">
          <div className="flex gap-x-5 items-center justify-between">
            <p className="text-[#BDBDBD] text-semibold">Description</p>
            {author ? (
              <EditVideo
                videoId={videoId}
                title={originalTitle}
                description={formattedDescription}
              />
            ) : (
              <></>
            )}
          </div>
          <p className="text-[#9D9D9D] text-lg text-medium">
            {formattedDescription}
          </p>
        </div>
      </div>
      <div className="lg:col-span-1 flex flex-col gap-y-16">
        <div className="flex justify-end gap-x-3 items-center">
          <CopyLink
            variant="outline"
            className="rounded-full bg-transparent px-10"
            videoId={videoId}
          />
          <RichLink
            description={truncateString(formattedDescription, 150)}
            id={videoId}
            source={video.source}
            title={video.title as string}
          />
          <Download className="text-[#4d4c4c]" />
        </div>
        <div>
          <TabMenu
            defaultValue="Ai tools"
            triggers={['Ai tools', 'Transcript', 'Summary', 'Activity']}
          >
            <AiTools
              videoId={videoId}
              trial={video.User?.trial!}
              plan={video.User?.subscription?.plan!}
            />
            <VideoTranscript transcript={video.summery!} />
            <VideoSummary 
              description={video.description} 
              videoId={videoId}
              isProUser={video.User?.subscription?.plan === 'PRO'}
            />
            <Activities
              author={video.User?.firstname as string}
              videoId={videoId}
            />
          </TabMenu>
        </div>
      </div>
    </div>
  )
}

export default VideoPreview
