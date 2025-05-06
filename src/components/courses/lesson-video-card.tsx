'use client'
import React from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { FileText, Play, Video, BookOpen, ClipboardEdit } from 'lucide-react'

type Props = {
  id: string
  title: string
  description?: string | null
  courseId: string
  type: 'video' | 'text' | 'quiz' | 'assignment'
  duration?: number | null
  previewable: boolean
  videoId?: string | null
  videoThumbnail?: string | null
  videoTitle?: string | null
  createdAt: Date
  completed?: boolean
  progress?: number
  User?: {
    firstname: string | null
    lastname: string | null
    image: string | null
  } | null
}

const LessonVideoCard = (props: Props) => {
  // Get the appropriate icon based on lesson type
  const getLessonIcon = () => {
    switch(props.type) {
      case 'video': return <Video className="h-5 w-5 text-primary" />;
      case 'text': return <BookOpen className="h-5 w-5 text-primary" />;
      case 'quiz': return <FileText className="h-5 w-5 text-primary" />;
      case 'assignment': return <ClipboardEdit className="h-5 w-5 text-primary" />;
      default: return <Video className="h-5 w-5 text-primary" />;
    }
  };

  // Get lesson type text
  const getLessonTypeText = () => {
    switch(props.type) {
      case 'video': return 'Video Lesson';
      case 'text': return 'Text Lesson';
      case 'quiz': return 'Quiz';
      case 'assignment': return 'Assignment';
      default: return 'Lesson';
    }
  };

  return (
    <div className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/20 w-full relative">
      <Link
        href={`/courses/${props.courseId}/lessons/${props.id}`}
        prefetch={true}
        className="flex flex-col h-full"
      >
        <div className="p-8 flex flex-col h-full relative">
          {/* Light background number/decoration like in the image */}
          <div className="absolute right-4 top-4 text-[140px] font-bold text-gray-50 leading-none opacity-70 select-none z-0">
            {props.type === 'video' ? '1' : props.type === 'text' ? '2' : props.type === 'quiz' ? '3' : '4'}
          </div>
          
          <div className="relative z-10">
            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {props.title}
            </h2>
            
            {/* Description */}
            {props.description && (
              <p className="text-gray-600 mb-6">
                {props.description}
              </p>
            )}
            
            {/* Lesson Info */}
            <div className="flex items-center gap-2 mt-auto">
              <div className="flex items-center gap-2">
                {getLessonIcon()}
                <span className="text-sm text-gray-500">{getLessonTypeText()}</span>
              </div>
              
              {props.duration && (
                <span className="text-sm text-gray-500 ml-4">
                  {Math.ceil(props.duration / 60)} min
                </span>
              )}
              
              {/* Completion status */}
              {props.completed && (
                <Badge className="ml-auto bg-green-100 text-green-700 border-0">
                  Completed
                </Badge>
              )}
            </div>
            
            {/* Progress indicator */}
            {!props.completed && props.progress && props.progress > 0 && (
              <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden w-full">
                <div 
                  className="h-1 bg-primary rounded-full" 
                  style={{ width: `${props.progress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}

export default LessonVideoCard 