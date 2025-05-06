'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock, BookOpen, Copy, Check, Share2, Bookmark, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import axios from 'axios';
import { cn } from '@/lib/utils';
import LessonNavigation from './LessonNavigation';
import { useRouter } from 'next/navigation';

interface TextLessonViewProps {
  content: string;
  lessonId: string;
  userId?: string;
  isPreview?: boolean;
  readTime?: number;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  savedProgress?: number;
  // Navigation props
  courseId?: string;
  courseTitle?: string;
  sectionTitle?: string;
  lessonTitle?: string;
  nextLessonId?: string;
  prevLessonId?: string;
}

export default function TextLessonView({
  content,
  lessonId,
  userId,
  isPreview = false,
  readTime = 5,
  onProgress,
  onComplete,
  savedProgress = 0,
  // Navigation props
  courseId,
  courseTitle,
  sectionTitle,
  lessonTitle,
  nextLessonId,
  prevLessonId
}: TextLessonViewProps) {
  const [progress, setProgress] = useState(savedProgress);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(progress >= 100);
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const progressSyncTimeout = useRef<any>(null);
  const progressCheckInterval = useRef<any>(null);
  
  const router = useRouter();
  
  // Set up scroll tracking to monitor progress
  useEffect(() => {
    const calculateReadingProgress = () => {
      if (!contentRef.current) return;
      
      const element = contentRef.current;
      const totalHeight = element.scrollHeight - element.clientHeight;
      const scrollPosition = element.scrollTop;
      
      // Calculate progress based on scroll position
      let calculatedProgress = Math.min(
        Math.round((scrollPosition / totalHeight) * 100),
        100
      );
      
      // If we can't calculate based on scroll (content is shorter than viewport)
      // use time-based calculation instead
      if (totalHeight <= 0) {
        // Just increase progress steadily over time
        calculatedProgress = Math.min(progress + 1, 100);
      }
      
      if (calculatedProgress > progress) {
        setProgress(calculatedProgress);
        onProgress?.(calculatedProgress);
        
        // Sync with server
        if (progressSyncTimeout.current) {
          clearTimeout(progressSyncTimeout.current);
        }
        
        progressSyncTimeout.current = setTimeout(() => {
          syncProgress(calculatedProgress);
        }, 3000);
        
        // Mark as completed if reached 95% or more
        if (calculatedProgress >= 95 && !isCompleted) {
          setIsCompleted(true);
          onComplete?.();
        }
      }
    };
    
    // Set up scroll event listener
    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', calculateReadingProgress);
      
      // For very short content, use time-based tracking
      progressCheckInterval.current = setInterval(() => {
        calculateReadingProgress();
      }, 15000); // Check every 15 seconds
    }
    
    return () => {
      if (contentElement) {
        contentElement.removeEventListener('scroll', calculateReadingProgress);
      }
      
      if (progressCheckInterval.current) {
        clearInterval(progressCheckInterval.current);
      }
      
      if (progressSyncTimeout.current) {
        clearTimeout(progressSyncTimeout.current);
      }
    };
  }, [progress, onProgress, onComplete, isCompleted]);
  
  // Sync progress with server
  const syncProgress = async (progressValue: number) => {
    if (!userId || isPreview) return;
    
    try {
      await axios.post(`/api/courses/lessons/${lessonId}/progress`, {
        progress: progressValue,
        completed: progressValue >= 95
      });
    } catch (err) {
      console.error('Error syncing progress:', err);
    }
  };
  
  // Handle copy to clipboard
  const copyToClipboard = () => {
    if (!content) return;
    
    try {
      // Strip HTML tags for plain text copy
      const tempElement = document.createElement('div');
      tempElement.innerHTML = content;
      const textContent = tempElement.textContent || tempElement.innerText;
      
      navigator.clipboard.writeText(textContent);
      setCopied(true);
      toast.success('Content copied to clipboard');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
      toast.error('Failed to copy content');
    }
  };
  
  // Handle bookmark
  const toggleBookmark = () => {
    setBookmarked(!bookmarked);
    toast.success(bookmarked ? 'Bookmark removed' : 'Lesson bookmarked for later');
  };
  
  // Create a print-friendly version
  const printContent = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Lesson Content</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1, h2, h3, h4, h5, h6 {
              margin-top: 24px;
              margin-bottom: 16px;
            }
            p {
              margin-bottom: 16px;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            code {
              font-family: monospace;
              background-color: #f0f0f0;
              padding: 2px 4px;
              border-radius: 3px;
            }
            pre {
              background-color: #f0f0f0;
              padding: 16px;
              border-radius: 4px;
              overflow-x: auto;
            }
          </style>
        </head>
        <body>
          ${content}
          <div style="margin-top: 40px; color: #666; font-size: 12px;">
            Printed from AetherLMS Learning Platform
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };
  
  // Share lesson
  const shareLesson = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Lesson Content',
        url: window.location.href
      })
      .catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      toast.success('Lesson URL copied to clipboard');
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Navigation using shared component */}
      <LessonNavigation 
        courseId={courseId}
        courseTitle={courseTitle}
        sectionTitle={sectionTitle}
        lessonTitle={lessonTitle}
        prevLessonId={prevLessonId}
        nextLessonId={nextLessonId}
      />
      
      <div className="flex items-center justify-between bg-card p-4 rounded-t-lg border border-border elevation-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Text Lesson</span>
          
          {readTime > 0 && (
            <>
              <Separator orientation="vertical" className="h-4 bg-border" />
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{readTime} min read</span>
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={copyToClipboard}
            title="Copy content"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={toggleBookmark}
            title={bookmarked ? "Remove bookmark" : "Bookmark lesson"}
          >
            <Bookmark className="h-4 w-4" fill={bookmarked ? "currentColor" : "none"} />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="h-4 w-4"
                >
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
              <DropdownMenuItem 
                onClick={printContent}
                className="hover:bg-muted cursor-pointer"
              >
                <Download className="h-4 w-4 mr-2" />
                Print / Download
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={shareLesson}
                className="hover:bg-muted cursor-pointer"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Lesson
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div
        ref={contentRef}
        className="relative bg-card border border-t-0 border-border rounded-b-lg p-6 max-h-[700px] overflow-y-auto custom-scrollbar"
      >
        <div 
          className="prose max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
      
      <div className="flex items-center justify-between bg-card p-4 rounded-lg border border-border elevation-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Progress value={progress} className="w-32 h-2" />
            <span className="text-xs text-muted-foreground">{progress}% complete</span>
          </div>
        </div>
        
        <div>
          {isCompleted ? (
            <Badge className="bg-chart-success/20 text-chart-success hover:bg-chart-success/30">
              Completed
            </Badge>
          ) : progress > 0 ? (
            <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
              In Progress
            </Badge>
          ) : (
            <Badge className="bg-muted text-muted-foreground hover:bg-muted/80">
              Not Started
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
} 