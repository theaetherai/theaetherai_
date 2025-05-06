'use client'

import { Button } from '@/components/ui/button'
import { LessonProps } from '@/types/index.type'
import { CheckCircle2, CircleDashed, Film, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import axios from 'axios'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd'

interface LessonListProps {
  lessons: (Omit<LessonProps['data'][0], 'Course'> & { 
    completed?: boolean,
    Course?: { title: string } | null 
  })[]
  courseId: string
  isOwner: boolean
}

export default function LessonList({ 
  lessons, 
  courseId, 
  isOwner 
}: LessonListProps) {
  const router = useRouter()
  const [isReordering, setIsReordering] = useState(false)
  const [orderedLessons, setOrderedLessons] = useState(lessons)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const handleAddLesson = () => {
    router.push(`/courses/${courseId}/lessons/create`)
  }
  
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
        // Update the local state
        setOrderedLessons(prev => 
          prev.map(lesson => 
            lesson.id === lessonId 
              ? { ...lesson, completed: !completed } 
              : lesson
          )
        )
        
        toast.success(completed ? 'Lesson marked as incomplete' : 'Lesson marked as complete')
      }
    } catch (error) {
      toast.error('Failed to update lesson progress')
    }
  }
  
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    
    const items = Array.from(orderedLessons)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    
    // Update order numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1
    }))
    
    setOrderedLessons(updatedItems)
    
    // Save the new order to the server
    try {
      for (const lesson of updatedItems) {
        await axios.patch(`/api/courses/${courseId}/lessons/${lesson.id}`, {
          order: lesson.order
        })
      }
      
      toast.success('Lesson order updated')
    } catch (error) {
      toast.error('Failed to update lesson order')
    }
  }
  
  const toggleReordering = () => {
    setIsReordering(!isReordering)
  }
  
  if (lessons.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-[#3A3A3A] rounded-lg">
        <p className="text-[#9D9D9D] mb-4">No lessons available for this course yet</p>
        {isOwner && (
          <Button 
            onClick={handleAddLesson}
            className="bg-[#2A2A2A] hover:bg-[#3A3A3A]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add your first lesson
          </Button>
        )}
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Course Content</h3>
        
        {isOwner && (
          <div className="flex gap-2">
            {lessons.length > 1 && (
              <Button
                variant="outline"
                onClick={toggleReordering}
                className="bg-[#2A2A2A] hover:bg-[#3A3A3A] border-[#3A3A3A]"
              >
                {isReordering ? 'Done Reordering' : 'Reorder Lessons'}
              </Button>
            )}
            <Button 
              onClick={handleAddLesson}
              className="bg-[#2A2A2A] hover:bg-[#3A3A3A]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Lesson
            </Button>
          </div>
        )}
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="lessons" isDropDisabled={!isReordering}>
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {orderedLessons.map((lesson, index) => (
                <Draggable 
                  key={lesson.id} 
                  draggableId={lesson.id} 
                  index={index}
                  isDragDisabled={!isReordering}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center p-4 rounded-lg border ${
                        isReordering ? 'border-[#3A3A3A]' : 'border-[#2A2A2A]'
                      } bg-[#1A1A1A]`}
                    >
                      {isReordering && (
                        <div 
                          {...provided.dragHandleProps}
                          className="mr-2 text-[#707070]"
                        >
                          <GripVertical size={20} />
                        </div>
                      )}
                      
                      <Link
                        href={`/courses/${courseId}/lessons/${lesson.id}`}
                        className="flex-1 flex items-center"
                      >
                        <div className="mr-4">
                          {lesson.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <CircleDashed className="h-5 w-5 text-[#707070]" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{lesson.title}</h4>
                          {lesson.content && (
                            <p className="text-sm text-[#9D9D9D] line-clamp-1">
                              {lesson.content.substring(0, 100)}
                            </p>
                          )}
                        </div>
                      </Link>
                      
                      {lesson.Video && (
                        <div className="text-[#9D9D9D] mr-4 flex items-center">
                          <Film size={16} className="mr-1" />
                          <span className="text-sm">Video</span>
                        </div>
                      )}
                      
                      {!isOwner && !isReordering && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkComplete(lesson.id, lesson.completed || false)}
                          className="text-[#9D9D9D] hover:text-white"
                        >
                          {lesson.completed ? 'Mark Incomplete' : 'Mark Complete'}
                        </Button>
                      )}
                      
                      {isOwner && !isReordering && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditLesson(lesson.id)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Lesson
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteLesson(lesson.id)}
                              className="text-red-500 focus:text-red-500"
                              disabled={deletingId === lesson.id}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {deletingId === lesson.id ? 'Deleting...' : 'Delete Lesson'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
} 