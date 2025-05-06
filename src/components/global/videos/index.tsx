'use client'
import { getAllUserVideos } from '@/actions/workspace'
import VideoRecorderDuotone from '@/components/icons/video-recorder-duotone'
import { useQueryData } from '@/hooks/useQueryData'
import { cn } from '@/lib/utils'
import { VideosProps } from '@/types/index.type'
import React, { useEffect } from 'react'
import VideoCard from './video-card'
import { useMutationDataState } from '@/hooks/useMutationData'
import { RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  folderId: string
  videosKey: string
  workspaceId: string
}

const Videos = ({ folderId, videosKey, workspaceId }: Props) => {
  
  const { data: videoData, refetch } = useQueryData([videosKey], () =>
    getAllUserVideos(folderId)
  )

  // Listen for video location change mutations
  const { latestVariables: videoLocationChange } = useMutationDataState(['move-video-location'])
  
  // Refetch videos when a video location is changed
  useEffect(() => {
    if (videoLocationChange?.status === 'success') {
      // Slight delay to ensure backend has processed the change
      setTimeout(() => {
        refetch();
      }, 300);
    }
  }, [videoLocationChange, refetch]);

  const { status: videosStatus, data: videos } = videoData as VideosProps

  const handleManualRefresh = () => {
    refetch();
  }

  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <VideoRecorderDuotone />
          <h2 className="text-[#BdBdBd] text-xl">Videos</h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleManualRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCcw size={16} />
          <span>Refresh</span>
        </Button>
      </div>
      <section
        className={cn(
          videosStatus !== 200
            ? 'p-5'
            : 'grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
        )}
      >
        {videosStatus === 200 ? (
          videos.map((video) => (
            <VideoCard
              key={video.id}
              workspaceId={workspaceId}
              {...video}
            />
          ))
        ) : (
          <p className="text-[#BDBDBD]"> No videos in workspace</p>
        )}
      </section>
    </div>
  )
}

export default Videos
