'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BookOpen, User, Calendar, UserCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'

interface CoursePreviewProps {
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
  isOpen: boolean
  onClose: () => void
}

export default function CoursePreview({
  id,
  title,
  description,
  lessonsCount,
  enrollmentsCount,
  createdAt,
  author,
  isEnrolled = false,
  isOpen,
  onClose
}: CoursePreviewProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const handleViewCourse = () => {
    router.push(`/courses/${id}`)
    onClose()
  }
  
  const handleEnroll = async () => {
    setIsLoading(true)
    
    try {
      const response = await axios.post(`/api/courses/${id}/enroll`)
      
      if (response.data.status === 200 || response.data.status === 201) {
        toast.success('Successfully enrolled in course')
        router.refresh()
        onClose()
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
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-[#1A1A1A] border-[#2A2A2A] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-[#9D9D9D]">
            <User size={14} />
            <span>{authorName}</span>
            <span className="text-[#707070] text-xs">•</span>
            <Calendar size={14} />
            <span>{timeAgo}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-[#BDBDBD]">
            {description || 'No description provided for this course.'}
          </div>
          
          <div className="flex flex-wrap gap-6 text-sm text-[#9D9D9D]">
            <div className="flex items-center gap-1">
              <BookOpen size={16} />
              <span>{lessonsCount} {lessonsCount === 1 ? 'lesson' : 'lessons'}</span>
            </div>
            <div className="flex items-center gap-1">
              <UserCheck size={16} />
              <span>{enrollmentsCount} {enrollmentsCount === 1 ? 'student' : 'students'}</span>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="bg-[#2A2A2A] hover:bg-[#3A3A3A] border-[#3A3A3A]"
            >
              Close
            </Button>
            
            {isEnrolled ? (
              <Button 
                onClick={handleViewCourse}
                className="bg-[#2A2A2A] hover:bg-[#3A3A3A]"
              >
                View Course
              </Button>
            ) : (
              <Button 
                onClick={handleEnroll} 
                disabled={isLoading}
                className="bg-[#2A2A2A] hover:bg-[#3A3A3A]"
              >
                {isLoading ? 'Enrolling...' : 'Enroll Now'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}