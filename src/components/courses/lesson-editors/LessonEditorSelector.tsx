'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import VideoLessonEditor from './VideoLessonEditor'
import TextLessonEditor from './TextLessonEditor'
import QuizLessonEditor from './QuizLessonEditor'
import AssignmentLessonEditor from './AssignmentLessonEditor'
import { LessonType } from '@/types/course'
import { cn } from '@/lib/utils'

interface LessonEditorSelectorProps {
  lessonId: string
  courseId: string
  defaultType?: LessonType
  onSave: () => void
  onCancel: () => void
}

export default function LessonEditorSelector({
  lessonId,
  courseId,
  defaultType = 'video',
  onSave,
  onCancel
}: LessonEditorSelectorProps) {
  const [lessonData, setLessonData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchLessonData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Check if the API route exists before making the full request
        const routeCheck = await fetch(`/api/courses/lessons/${lessonId}`, { 
          method: 'HEAD',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        if (routeCheck.status === 404) {
          console.warn('Lesson API route is not fully implemented')
          // Create fallback data based on the default type
          const fallbackData = {
            id: lessonId,
            title: 'New Lesson',
            description: '',
            type: defaultType,
            previewable: false
          }
          setLessonData(fallbackData)
          setLoading(false)
          return
        }
        
        const response = await axios.get(`/api/courses/lessons/${lessonId}`)
        
        if (response.data.status === 200) {
          // Parse JSON fields if they exist
          const data = response.data.data
          
          if (data.questions && typeof data.questions === 'string') {
            try {
              data.questions = JSON.parse(data.questions)
            } catch (e) {
              data.questions = []
            }
          }
          
          if (data.rubric && typeof data.rubric === 'string') {
            try {
              data.rubric = JSON.parse(data.rubric)
            } catch (e) {
              data.rubric = []
            }
          }
          
          setLessonData(data)
        } else {
          setError('Failed to load lesson data')
        }
      } catch (error) {
        console.error('Error fetching lesson data:', error)
        
        // Create fallback data for development/testing
        if (process.env.NODE_ENV !== 'production') {
          const fallbackData = {
            id: lessonId,
            title: 'Development Lesson',
            description: 'This is fallback data because the API failed',
            type: defaultType,
            previewable: false
          }
          setLessonData(fallbackData)
          setError('Using fallback data - API error occurred')
        } else {
          setError('An error occurred while fetching lesson data')
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchLessonData()
  }, [lessonId, defaultType])
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading lesson editor...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 text-center animate-fade-in">
        <p className="text-red-400">{error}</p>
        <button 
          onClick={onCancel}
          className="mt-4 px-4 py-2 bg-background text-foreground border border-border rounded-md hover:bg-muted"
        >
          Go Back
        </button>
      </div>
    )
  }
  
  // If we have no lesson data but we have a default type, create a new lesson object
  const lessonType = lessonData?.type || defaultType
  
  // Render the appropriate editor based on lesson type
  switch (lessonType) {
    case 'video':
      return (
        <VideoLessonEditor
          lessonId={lessonId}
          courseId={courseId}
          initialData={lessonData}
          onSave={onSave}
          onCancel={onCancel}
        />
      )
    case 'text':
      return (
        <TextLessonEditor
          lessonId={lessonId}
          courseId={courseId}
          initialData={lessonData}
          onSave={onSave}
          onCancel={onCancel}
        />
      )
    case 'quiz':
      return (
        <QuizLessonEditor
          lessonId={lessonId}
          courseId={courseId}
          initialData={lessonData}
          onSave={onSave}
          onCancel={onCancel}
        />
      )
    case 'assignment':
      return (
        <AssignmentLessonEditor
          lessonId={lessonId}
          courseId={courseId}
          initialData={lessonData}
          onSave={onSave}
          onCancel={onCancel}
        />
      )
    default:
      return (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-4 text-center animate-fade-in">
          <p className="text-yellow-400">Unsupported lesson type: {lessonType}</p>
          <button 
            onClick={onCancel}
            className="mt-4 px-4 py-2 bg-background text-foreground border border-border rounded-md hover:bg-muted"
          >
            Go Back
          </button>
        </div>
      )
  }
} 