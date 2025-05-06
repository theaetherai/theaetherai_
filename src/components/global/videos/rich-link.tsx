'use client'

import { Button } from '@/components/ui/button'
import React, { useMemo } from 'react'
import { toast } from 'sonner'

type Props = { title: string; id: string; source: string; description: string }

const RichLink = ({ description, id, source, title }: Props) => {
  // Format description for embedded link
  const formattedDescription = useMemo(() => {
    if (!description) return "";
    
    try {
      // Check if description is JSON
      const parsedData = JSON.parse(description);
      if (parsedData.summary || parsedData.original) {
        // Return the original text description from the JSON
        return parsedData.summary || "";
      }
      return description;
    } catch (e) {
      // Not JSON, return as is
      return description;
    }
  }, [description]);

  const copyRichText = () => {
    const orignalTitle = title
    const thumbnail = `<a style="display: flex; flex-direction: column; gap: 10px" href="${process.env.NEXT_PUBLIC_HOST_URL}/preview/${id}">
    <h3 style="text-decoration: none; color: black; margin: 0;">${orignalTitle}</h3>
    <p style="text-decoration: none; color: black; margin: 0;">${formattedDescription}</p>
    <video
        width="320"
        style="display: block"
        >
            <source
                type="video/webm"
                src="${process.env.NEXT_PUBLIC_CLOUD_FRONT_STREAM_URL}/${source}"
            />
        </video>
    </a>`
    const thumbnailBlob = new Blob([thumbnail], { type: 'text/html' })
    const blobTitle = new Blob([orignalTitle], { type: 'text/plain' })
    const data = [
      new ClipboardItem({
        ['text/plain']: blobTitle,
        ['text/html']: thumbnailBlob,
      }),
    ]
    navigator.clipboard.write(data).then(() => {
      return toast('Embedded Link Copied', {
        description: 'Successfully copied embedded link',
      })
    })
  }
  return (
    <Button
      onClick={copyRichText}
      className="rounded-full"
    >
      Get Embedded Code
    </Button>
  )
}

export default RichLink
