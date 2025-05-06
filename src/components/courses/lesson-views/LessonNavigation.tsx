'use client';

import { ChevronLeft, ChevronRight, Home, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface LessonNavigationProps {
  courseId?: string;
  courseTitle?: string;
  sectionTitle?: string;
  lessonTitle?: string;
  prevLessonId?: string;
  nextLessonId?: string;
}

export default function LessonNavigation({
  courseId,
  courseTitle = 'Course',
  sectionTitle,
  lessonTitle = 'Lesson',
  prevLessonId,
  nextLessonId
}: LessonNavigationProps) {
  const router = useRouter();
  
  // Navigate to next or previous lesson
  const navigateToLesson = (targetLessonId: string | undefined) => {
    if (targetLessonId && courseId) {
      router.push(`/courses/${courseId}/lessons/${targetLessonId}`);
    }
  };
  
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm mb-4">
      <div className="p-3 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 text-sm overflow-x-auto max-w-full pb-1">
          {courseId && (
            <Link href={`/courses/${courseId}`} className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
              <Home className="h-3.5 w-3.5 mr-1" />
              <span>{courseTitle}</span>
            </Link>
          )}
          <span className="text-muted-foreground mx-1">/</span>
          {sectionTitle && (
            <>
              <span className="text-muted-foreground truncate max-w-[150px]">{sectionTitle}</span>
              <span className="text-muted-foreground mx-1">/</span>
            </>
          )}
          <span className="text-foreground font-medium truncate max-w-[200px]">
            {lessonTitle}
          </span>
        </div>
        
        {/* Lesson Navigation Controls */}
        <div className="flex items-center gap-2 mt-1 sm:mt-0">
          <Button 
            variant="outline" 
            size="sm"
            disabled={!prevLessonId}
            onClick={() => navigateToLesson(prevLessonId)}
            className="h-8"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          {courseId && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push(`/courses/${courseId}`)}
              className="h-8"
            >
              <Layers className="h-4 w-4 mr-1" />
              Back to Course
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            disabled={!nextLessonId}
            onClick={() => navigateToLesson(nextLessonId)}
            className="h-8"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
} 