'use client'

import { Lesson, Section } from '@prisma/client'
import LessonVideoCard from './lesson-video-card'
import { Progress } from '@/components/ui/progress'
import { useState } from 'react'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'

interface LessonWithProgress extends Lesson {
  completed?: boolean
  progress?: number
  videoThumbnail?: string | null
  videoTitle?: string | null
  User?: {
    firstname: string | null
    lastname: string | null
    image: string | null
  } | null
}

interface SectionWithLessons extends Section {
  lessons: LessonWithProgress[]
}

interface LessonGridProps {
  sections: SectionWithLessons[]
  courseId: string
  courseProgress?: number
  totalLessons: number
}

export default function LessonGrid({
  sections,
  courseId,
  courseProgress = 0,
  totalLessons
}: LessonGridProps) {
  const [selectedSection, setSelectedSection] = useState<string>('all')
  
  // Flatten lessons or filter by section
  const lessons = selectedSection === 'all'
    ? sections.flatMap(section => section.lessons)
    : sections.find(section => section.id === selectedSection)?.lessons || []
  
  const progressPercentage = totalLessons > 0 
    ? Math.round((courseProgress / totalLessons) * 100)
    : 0
  
  return (
    <div className="space-y-8">
      {/* Course progress */}
      {courseProgress > 0 && (
        <div className="w-full mb-6 animate-fade-in">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-foreground">Your progress</h3>
            <span className="text-sm text-muted-foreground">{progressPercentage}% complete</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-muted overflow-hidden"
            indicatorClassName="bg-gradient-to-r from-primary to-accent transition-all duration-slow"
          />
        </div>
      )}
      
      {/* Section filter */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold tracking-tight">Course Lessons</h2>
        
        <Select
          value={selectedSection}
          onValueChange={setSelectedSection}
        >
          <SelectTrigger className="w-[200px] border-border bg-card text-card-foreground">
            <SelectValue placeholder="Filter by section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {sections.map(section => (
              <SelectItem key={section.id} value={section.id}>
                {section.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Lesson cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {lessons.map((lesson, index) => (
          <div 
            key={lesson.id}
            className="transition-all duration-standard animate-fade-in"
            style={{ 
              animationDelay: `${index * 50}ms`,
              opacity: 0,
              transform: 'translateY(10px)'
            }}
          >
            <LessonVideoCard
              id={lesson.id}
              title={lesson.title}
              description={lesson.description}
              courseId={courseId}
              type={lesson.type as 'video' | 'text' | 'quiz' | 'assignment'}
              duration={lesson.duration}
              previewable={lesson.previewable}
              videoId={lesson.videoId}
              videoThumbnail={lesson.videoThumbnail}
              videoTitle={lesson.videoTitle}
              createdAt={lesson.createdAt}
              completed={lesson.completed}
              progress={lesson.progress}
              User={lesson.User}
            />
          </div>
        ))}
      </div>
      
      {lessons.length === 0 && (
        <div className="text-center py-12 bg-secondary/30 rounded-xl border border-border">
          <p className="text-muted-foreground">No lessons found in this section.</p>
        </div>
      )}
    </div>
  )
} 