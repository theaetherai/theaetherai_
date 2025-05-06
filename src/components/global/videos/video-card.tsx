'use client'
import React from 'react'
import Loader from '../loader'
import CardMenu from './video-card-menu'
import ChangeVideoLocation from '@/components/forms/change-video-location'
import CopyLink from './copy-link'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dot, Share2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  User: {
    firstname: string | null
    lastname: string | null
    image: string | null
  } | null
  id: string
  Folder: {
    id: string
    name: string
  } | null
  createdAt: Date
  title: string | null
  source: string
  processing: boolean
  workspaceId: string
}

const VideoCard = (props: Props) => {
  const daysAgo = Math.floor(
    (new Date().getTime() - props.createdAt.getTime()) / (24 * 60 * 60 * 1000)
  )

  return (
    <Loader
      className="bg-card flex justify-center items-center sleek-card rounded-xl elevation-1"
      state={props.processing}
    >
      <div className="group overflow-hidden cursor-pointer bg-card relative sleek-card flex flex-col rounded-xl transition-all hover:scale-[1.01]">
        <div className="absolute top-3 right-3 z-50 gap-x-3 hidden group-hover:flex">
          <CardMenu
            currentFolderName={props.Folder?.name}
            videoId={props.id}
            currentWorkspace={props.workspaceId}
            currentFolder={props.Folder?.id}
          />
          <CopyLink
            className="p-[5px] h-5 hover:bg-secondary hover:text-foreground bg-secondary/50 rounded-md"
            videoId={props.id}
          />
        </div>
        <Link
          href={`/dashboard/${props.workspaceId}/video/${props.id}`}
          className="hover:bg-secondary/30 transition-all duration-300 flex flex-col justify-between h-full"
        >
          <video
            controls={false}
            preload="metadata"
            className="w-full aspect-video opacity-100 z-20"
          >
            <source
              src={`${props.source}`}
            />
          </video>
          <div className="px-5 py-3 flex flex-col gap-7-2 z-20">
            <h2 className="text-sm font-semibold text-foreground">
              {props.title}
            </h2>
            <div className="flex gap-x-2 items-center mt-4">
              <Avatar className="w-8 h-8 sleek-avatar">
                <AvatarImage src={props.User?.image as string} />
                <AvatarFallback className="bg-muted-foreground text-background">
                  <User />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="capitalize text-xs text-foreground">
                  {props.User?.firstname} {props.User?.lastname}
                </p>
                <p className="text-muted-foreground text-xs flex items-center">
                  <Dot /> {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <span className="flex gap-x-1 items-center">
                <Share2
                  className="text-primary"
                  size={12}
                />
                <p className="text-xs text-muted-foreground capitalize">
                  {props.User?.firstname}'s Workspace
                </p>
              </span>
            </div>
          </div>
        </Link>
      </div>
    </Loader>
  )
}

export default VideoCard
