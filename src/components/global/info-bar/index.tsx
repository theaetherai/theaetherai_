import VideoRecorderIcon from '@/components/icons/video-recorder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserButton } from '@clerk/nextjs'
import { Search, UploadIcon } from 'lucide-react'
import React from 'react'

type Props = {}

const InfoBar = (props: Props) => {
  return (
    <header className="pl-20 md:pl-[265px] fixed p-4 w-full flex items-center justify-between gap-4 bg-background/50 backdrop-blur-sm border-b border-border z-10 text-[#f5f5f5]">
      <div className="flex gap-4 justify-center items-center border rounded-full px-4 w-full max-w-lg">
        <Search
          size={25}
          className="text-[#e0e0e0]"
        />
        <Input
          className="bg-transparent border-none !placeholder-[#e0e0e0] text-[#f5f5f5]"
          placeholder="Search for people, projects, tags & folders"
        />
      </div>
      <div className="flex items-center gap-4">
        <Button variant="secondary" className="flex items-center gap-2 text-[#f5f5f5]">
          <UploadIcon size={20} />{' '}
          <span className="flex items-center gap-2">Upload</span>
        </Button>
        <Button className="flex items-center gap-2 text-[#f5f5f5]">
          <VideoRecorderIcon />
          <span className="flex items-center gap-2">Record</span>
        </Button>
        <UserButton />
      </div>
    </header>
  )
}

export default InfoBar
