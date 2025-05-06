'use client'

import Link from 'next/link'
import { CheckCircle2, CircleDashed, Film, GripVertical, Pencil, Play, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Draggable } from 'react-beautiful-dnd'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Lesson {
  id: string
  title: string
  content?: string | null
  order: number
  completed?: boolean
  duration?: number | null
  videoId?: string | null
  video?: {
    id: string
    title?: string | null
  } | null
}

interface LessonRowProps {
  lesson: Lesson
  courseId: string
  isOwner: boolean
  isReordering: boolean
  index: number
  completed?: boolean
}

export function LessonRow({
  lesson,
  courseId,
  isOwner,
  isReordering,
  index,
  completed: explicitCompleted
}: LessonRowProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Use either the explicitly passed completed prop or the one from the lesson
  const isCompleted = explicitCompleted !== undefined ? explicitCompleted : !!lesson.completed
  
  const handleEditLesson = (lessonId: string) => {
    router.push(`/courses/${courseId}/lessons/${lessonId}/edit`)
  }
  
  const handleDeleteLesson = async (lessonId: string) => {
    try {
      setDeletingId(lessonId)
      
      const response = await axios.delete(`/api/courses/${courseId}/lessons/${lessonId}`)
      
      if (response.data.status === 200) {
        toast.success('Lesson deleted successfully')
        router.refresh()
      }
    } catch (error) {
      toast.error('Failed to delete lesson')
    } finally {
      setDeletingId(null)
    }
  }
  
  const handleMarkComplete = async (lessonId: string, completed: boolean) => {
    try {
      const response = await axios.patch(`/api/courses/${courseId}/lessons/${lessonId}`, {
        completed: !completed
      })
      
      if (response.data.status === 200) {
        toast.success(completed ? 'Lesson marked as incomplete' : 'Lesson marked as complete')
        router.refresh()
      }
    } catch (error) {
      toast.error('Failed to update lesson progress')
    }
  }

  // Format duration (convert minutes to hours and minutes if needed)
  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return null
    
    if (minutes < 60) {
      return `${minutes}min`
    }
    
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (remainingMinutes === 0) {
      return `${hours}hr`
    }
    
    return `${hours}hr ${remainingMinutes}min`
  }

  // Render the lesson row with the new styling
  const renderLessonContent = (dragHandleProps?: any) => (
    <div
      className={cn(
        "flex items-center p-3 rounded-md border border-border bg-card hover:bg-card/80",
        isReordering && "border-border/60 bg-muted/20"
      )}
    >
      {isReordering && dragHandleProps && (
        <div 
          {...dragHandleProps}
          className="mr-2 text-muted-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}
      
      <Link
        href={`/courses/${courseId}/lessons/${lesson.id}`}
        className="flex-1 flex items-center"
      >
        <div className="mr-3 flex-shrink-0">
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-chart-success" />
          ) : (
            <CircleDashed className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        
        <div className="flex-1 mr-4">
          <div className="flex items-center">
            {lesson.video && (
              <div className="mr-2 flex items-center bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                <Play className="h-3 w-3 mr-1" />
                <span>Video</span>
              </div>
            )}
            <h4 className="font-medium text-foreground">{lesson.title}</h4>
          </div>
          {lesson.content && (
            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
              {lesson.content.substring(0, 80)}
            </p>
          )}
        </div>
      </Link>
      
      {lesson.duration && (
        <div className="text-muted-foreground mr-4 text-sm">
          {formatDuration(lesson.duration)}
        </div>
      )}
      
      {!isOwner && !isReordering && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleMarkComplete(lesson.id, isCompleted)}
          className="text-muted-foreground hover:text-foreground"
        >
          {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
        </Button>
      )}
      
      {isOwner && !isReordering && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <span className="sr-only">Open menu</span>
              <Pencil className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            <DropdownMenuItem
              onClick={() => handleEditLesson(lesson.id)}
              className="cursor-pointer hover:bg-muted"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Lesson
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDeleteLesson(lesson.id)}
              disabled={deletingId === lesson.id}
              className="text-destructive cursor-pointer hover:bg-destructive/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deletingId === lesson.id ? 'Deleting...' : 'Delete Lesson'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )

  // If we're in reordering mode, wrap with Draggable
  return (
    <Draggable
      draggableId={lesson.id}
      index={index}
      isDragDisabled={!isReordering}
    >
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          {renderLessonContent(provided.dragHandleProps)}
        </div>
      )}
    </Draggable>
  )
} 