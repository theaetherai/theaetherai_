'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Clock, User, UserCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import StarRating from './star-rating'
import { cn } from '@/lib/utils'

// Function to check if a URL is valid
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

interface CourseCardProps {
  id: string
  title: string
  description: string | null
  lessonsCount: number
  enrollmentsCount: number
  createdAt: Date
  author: {
    firstname: string | null
    lastname: string | null
    image: string | null
  } | null
  isEnrolled?: boolean
  isOwner?: boolean
  preview?: boolean
  thumbnailUrl?: string
  rating?: number
  bestseller?: boolean
  price?: number
  discountPrice?: number
  category?: string
  level?: string
}

export default function CourseCard({
  id,
  title,
  description,
  lessonsCount,
  enrollmentsCount,
  createdAt,
  author,
  isEnrolled = false,
  isOwner = false,
  preview = false,
  thumbnailUrl = undefined,
  rating = 4.7,
  bestseller = false,
  price,
  discountPrice,
  category,
  level
}: CourseCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isValidImage, setIsValidImage] = useState(thumbnailUrl ? isValidUrl(thumbnailUrl) : false)
  
  // Validate the image URL when thumbnailUrl changes
  useEffect(() => {
    setIsValidImage(thumbnailUrl ? isValidUrl(thumbnailUrl) : false);
    setImageError(false); // Reset error state when URL changes
  }, [thumbnailUrl]);
  
  const handleCardClick = () => {
    if (!preview) {
      router.push(`/courses/${id}`)
    }
  }
  
  const handleEnroll = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLoading(true)
    
    try {
      const response = await axios.post(`/api/courses/${id}/enroll`)
      
      if (response.data.status === 200 || response.data.status === 201) {
        toast.success('Successfully enrolled in course')
        router.refresh()
      }
    } catch (error) {
      toast.error('Failed to enroll in course')
    } finally {
      setIsLoading(false)
    }
  }
  
  const authorName = author
    ? `${author.firstname || ''} ${author.lastname || ''}`.trim() || 'Unknown author'
    : 'Unknown author'
  
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true })
  
  const isNew = new Date(createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Less than 30 days old
  const isPopular = enrollmentsCount > 50;
  
  // Render the thumbnail image based on its validity and error state
  const renderThumbnail = () => {
    if (thumbnailUrl && isValidImage && !imageError) {
      return (
        <>
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </>
      );
    } else if (thumbnailUrl && !isValidImage) {
      // Fallback to regular img tag for non-whitelisted domains
      return (
        <>
          <img
            src={thumbnailUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </>
      );
    } else {
      // Default fallback graphic
      return (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-secondary/30 flex items-center justify-center">
          <BookOpen className="h-12 w-12 text-white opacity-80" />
        </div>
      );
    }
  };
  
  return (
    <Card
      variant="elevated"
      interactive
      className="bg-background rounded-xl min-w-[320px] max-w-[320px] border border-border/50 snap-start flex flex-col cursor-default animate-fade-in overflow-hidden"
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative w-full h-[180px] rounded-t-xl overflow-hidden">
        {renderThumbnail()}
        {bestseller && (
          <div className="absolute top-2 left-2 bg-accent/80 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
            Bestseller
          </div>
        )}
      </div>
      <CardContent className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-foreground text-lg mb-1 line-clamp-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-1">{authorName}</p>
        <div className="flex items-center mb-1">
          <span className="font-bold text-primary mr-1">{rating?.toFixed(1)}</span>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <span key={i}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill={i < Math.round(rating || 0) ? 'hsl(var(--primary))' : 'none'}
                  stroke={i < Math.round(rating || 0) ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                  strokeWidth="1"
                  className="inline-block"
                >
                  <polygon points="10,1 12.59,6.99 19,7.64 14,12.26 15.18,18.51 10,15.27 4.82,18.51 6,12.26 1,7.64 7.41,6.99" />
                </svg>
              </span>
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-1">({enrollmentsCount})</span>
        </div>
        <div className="flex items-center mt-2">
          {discountPrice ? (
            <>
              <span className="font-bold text-foreground text-lg">GHS {discountPrice.toFixed(2)}</span>
              <span className="text-muted-foreground line-through ml-2 text-base">GHS {price?.toFixed(2)}</span>
            </>
          ) : (
            <span className="font-bold text-foreground text-lg">GHS {price?.toFixed(2)}</span>
          )}
        </div>
        <div className="flex items-center mt-3 gap-2 text-xs">
          {level && (
            <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
              {level}
            </span>
          )}
          {category && (
            <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
              {category}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 