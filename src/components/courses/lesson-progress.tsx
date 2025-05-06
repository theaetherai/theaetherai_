'use client'

import { Button } from '@/components/ui/button'
import { CheckCircle, CircleDashed } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'

interface LessonProgressProps {
  lessonId: string
  courseId: string
  isCompleted: boolean
}

export default function LessonProgress({
  lessonId,
  courseId,
  isCompleted: initialIsCompleted
}: LessonProgressProps) {
  const router = useRouter()
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted)
  const [isLoading, setIsLoading] = useState(false)
  
  const handleToggleComplete = async () => {
    if (!courseId || !lessonId) {
      toast.error('Internal error: Missing course or lesson ID')
      console.error('LessonProgress: courseId or lessonId is undefined', { courseId, lessonId })
      return
    }
    try {
      setIsLoading(true)
      
      const response = await axios.patch(`/api/courses/${courseId}/lessons/${lessonId}`, {
        completed: !isCompleted
      })
      
      if (response.data.status === 200) {
        setIsCompleted(!isCompleted)
        toast.success(isCompleted ? 'Lesson marked as incomplete' : 'Lesson marked as complete')
        router.replace(`/courses/${courseId}/lessons/${lessonId}`)
      }
    } catch (error) {
      toast.error('Failed to update lesson progress')
      console.error('LessonProgress error:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Button 
      onClick={handleToggleComplete}
      variant="outline"
      className="flex items-center gap-2"
      disabled={isLoading}
    >
      {isCompleted ? (
        <>
          <CheckCircle className="h-5 w-5 text-green-500" />
          Mark as Incomplete
        </>
      ) : (
        <>
          <CircleDashed className="h-5 w-5" />
          Mark as Complete
        </>
      )}
    </Button>
  )
} 