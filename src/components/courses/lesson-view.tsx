'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ArrowRight, BookOpen, ClipboardEdit, FileQuestion, Video } from 'lucide-react';
import VideoLessonView from './lesson-views/VideoLessonView';
import TextLessonView from './lesson-views/TextLessonView';
import QuizLessonView from './lesson-views/QuizLessonView';
import AssignmentLessonView from './lesson-views/AssignmentLessonView';
import axios from 'axios';
import React from 'react';

interface LessonViewProps {
  courseId: string;
  lessonId: string;
  title: string;
  description?: string;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  content?: string;
  videoId?: string;
  isPreview?: boolean;
  isOwner?: boolean;
  onComplete?: () => void;
  prevLessonId?: string;
  nextLessonId?: string;
  
  // Video specific
  transcript?: string;
  captions?: any;
  
  // Quiz specific
  questions?: any[];
  timeLimit?: number;
  passingScore?: number;
  
  // Assignment specific
  rubric?: any[];
  dueDate?: string;
  fileTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
}

export default function LessonView({
  courseId,
  lessonId,
  title,
  description,
  type,
  content,
  videoId,
  isPreview = false,
  isOwner = false,
  onComplete,
  prevLessonId,
  nextLessonId,
  transcript,
  captions,
  questions = [],
  timeLimit,
  passingScore,
  rubric = [],
  dueDate,
  fileTypes = [],
  maxFileSize = 10,
  maxFiles = 1
}: LessonViewProps) {
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  useEffect(() => {
    // Reset state when lessonId changes
    setIsLoading(true);
    setProgress(0);
    setIsCompleted(false);
    
    const fetchProgress = async () => {
      if (!user || isPreview) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await axios.get(`/api/courses/lessons/${lessonId}/progress`);
        
        if (response.data.status === 200) {
          setProgress(response.data.data.progress || 0);
          setIsCompleted(response.data.data.completed || false);
        }
      } catch (error) {
        console.error('Error fetching lesson progress:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProgress();
  }, [lessonId, user, isPreview]);
  
  const handleProgress = (newProgress: number) => {
    setProgress(newProgress);
  };
  
  const handleComplete = () => {
    setIsCompleted(true);
    setProgress(100);
    onComplete?.();
  };
  
  const navigateToLesson = (id: string) => {
    if (!id) return;
    
    if (hasUnsavedChanges && (type === 'assignment' || type === 'quiz')) {
      const confirmLeave = confirm("You have unsaved changes. If you leave now, your progress may be lost. Are you sure you want to continue?");
      if (!confirmLeave) {
        return;
      }
    }
    
    router.push(`/courses/${courseId}/lessons/${id}`);
  };
  
  const getLessonTypeIcon = () => {
    switch (type) {
      case 'video': return Video;
      case 'text': return BookOpen;
      case 'quiz': return FileQuestion;
      case 'assignment': return ClipboardEdit;
      default: return Video;
    }
  };
  
  // Render lesson content based on type
  const renderLessonContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full rounded-lg" />
          <div className="flex justify-between">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      );
    }
    
    switch (type) {
      case 'video':
        if (!videoId) {
          return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Video className="h-20 w-20 text-[#3A3A3A] mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No Video Selected</h3>
              <p className="text-[#9D9D9D] max-w-md">
                This lesson has no video content assigned. Please contact the course creator.
              </p>
            </div>
          );
        }
        
        return (
          <VideoLessonView
            videoId={videoId}
            lessonId={lessonId}
            transcript={transcript}
            captions={captions}
            userId={user?.id}
            isPreview={isPreview}
            onProgress={handleProgress}
            onComplete={handleComplete}
            savedProgress={progress}
            courseTitle={title}
            sectionTitle={description}
            lessonTitle={title}
            nextLessonId={nextLessonId}
            prevLessonId={prevLessonId}
          />
        );
        
      case 'text':
        if (!content) {
          return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-20 w-20 text-[#3A3A3A] mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No Content Available</h3>
              <p className="text-[#9D9D9D] max-w-md">
                This lesson has no text content. Please contact the course creator.
              </p>
            </div>
          );
        }
        
        return (
          <TextLessonView
            content={content}
            lessonId={lessonId}
            userId={user?.id}
            isPreview={isPreview}
            onProgress={handleProgress}
            onComplete={handleComplete}
            savedProgress={progress}
            courseId={courseId}
            courseTitle={title}
            sectionTitle={description}
            lessonTitle={title}
            nextLessonId={nextLessonId}
            prevLessonId={prevLessonId}
          />
        );
        
      case 'quiz':
        // Parse questions if they're a string (JSON)
        let parsedQuestions = questions;
        console.log('[LESSON_VIEW] Quiz questions raw type:', typeof parsedQuestions);
        console.log('[LESSON_VIEW] Quiz questions raw preview:', 
          typeof parsedQuestions === 'string' 
            ? (parsedQuestions as string).substring(0, 200) + '...' 
            : Array.isArray(parsedQuestions) 
              ? `Array with ${parsedQuestions.length} items` 
              : 'Not a string or array');
        
        if (typeof parsedQuestions === 'string') {
          try {
            parsedQuestions = JSON.parse(parsedQuestions);
            console.log('[LESSON_VIEW] Successfully parsed quiz questions from string:', 
              Array.isArray(parsedQuestions) ? parsedQuestions.length : 'not an array');
            console.log('[LESSON_VIEW] First parsed question:', 
              Array.isArray(parsedQuestions) && parsedQuestions.length > 0 
                ? JSON.stringify(parsedQuestions[0], null, 2)
                : 'No questions available');
          } catch (error) {
            console.error('[LESSON_VIEW] Error parsing quiz questions string:', error);
            parsedQuestions = [];
          }
        }
        
        // Convert questions to the format QuizLessonView expects
        if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
          // Check if questions already have the expected structure
          const hasRequiredFormat = parsedQuestions[0].hasOwnProperty('type') && 
                                    parsedQuestions[0].hasOwnProperty('points');
                                    
          console.log('[LESSON_VIEW] Questions have required format?', hasRequiredFormat);
          
          if (!hasRequiredFormat) {
            console.log('[LESSON_VIEW] Converting questions to required format');
            parsedQuestions = parsedQuestions.map(q => ({
              ...q,
              type: 'multipleChoice',
              points: 1
            }));
          }
          
          console.log('[LESSON_VIEW] Formatted question sample:', 
            JSON.stringify(parsedQuestions[0], null, 2));
            
            // Check if these are sample questions
            const isSampleQuiz = parsedQuestions.some(q => 
              q.id?.includes('sample') || 
              q.id?.includes('q-') || 
              q.text?.includes('Sample Question') ||
              q.text?.includes('[SAMPLE]'));
            console.log('[LESSON_VIEW] Is this a sample quiz?', isSampleQuiz);
            
            // Warn course owners about sample questions
            if (isSampleQuiz && isOwner) {
              toast.warning('This quiz contains sample questions. Please edit the quiz to add your real questions.', {
                duration: 6000,
                id: 'sample-quiz-warning'
              });
            }
        } else {
          console.log('[LESSON_VIEW] No valid questions found or empty array');
        }
        
        if (!parsedQuestions || parsedQuestions.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileQuestion className="h-20 w-20 text-[#3A3A3A] mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Quiz Not Available</h3>
              <p className="text-[#9D9D9D] max-w-md">
                This quiz has no questions. Please contact the course creator.
              </p>
              
              {/* Debug tool for course creators */}
              {isOwner && (
                <div className="mt-8 p-4 border border-yellow-500/30 bg-yellow-500/10 rounded-md">
                  <h4 className="text-yellow-500 font-medium mb-2">Course Creator Tools</h4>
                  <p className="text-[#9D9D9D] text-sm mb-4">
                    This quiz has no questions. You can create a sample quiz to test functionality.
                  </p>
                  <div className="space-y-2">
                    <div className="bg-yellow-500/20 p-2 rounded-md border border-yellow-500/30">
                      <p className="text-yellow-300 text-sm font-medium">⚠️ WARNING: Sample questions are for testing only!</p>
                      <p className="text-[#9D9D9D] text-xs">The sample quiz will be visible to students. Remember to replace with real questions.</p>
                    </div>
                    <Button
                      onClick={async () => {
                        try {
                          // First check if there are already questions in the database
                          const lessonCheck = await axios.get(`/api/courses/lessons/${lessonId}`);
                          const existingQuestions = lessonCheck.data.data?.questions;
                          let hasExistingQuestions = false;
                          
                          try {
                            // Try to parse existing questions if they're a string
                            const parsed = typeof existingQuestions === 'string' 
                              ? JSON.parse(existingQuestions) 
                              : existingQuestions;
                            
                            if (Array.isArray(parsed) && parsed.length > 0) {
                              hasExistingQuestions = true;
                              console.log('[LESSON_VIEW] Found existing questions:', parsed.length);
                              
                              // If questions exist, ask user if they want to overwrite them
                              if (!confirm('There are already quiz questions saved but not displaying properly. Do you want to overwrite them with sample questions? This cannot be undone. CAUTION: Sample questions are for testing only and should be replaced with real content.')) {
                                toast.info('Operation cancelled. Your existing questions were preserved.');
                                return;
                              }
                            }
                          } catch (err) {
                            console.error('[LESSON_VIEW] Error parsing existing questions:', err);
                            // Continue with sample creation if parsing fails
                          }

                          const sampleQuestions = [
                            {
                              id: `q-sample-${Date.now()}-1`,
                              text: '[SAMPLE] Multiple Choice Question',
                              type: 'multipleChoice',
                              points: 1,
                              options: [
                                { id: `o-sample-${Date.now()}-1`, text: 'Correct Answer (Sample)', isCorrect: true },
                                { id: `o-sample-${Date.now()}-2`, text: 'Wrong Answer (Sample)', isCorrect: false },
                                { id: `o-sample-${Date.now()}-3`, text: 'Wrong Answer (Sample)', isCorrect: false },
                                { id: `o-sample-${Date.now()}-4`, text: 'Wrong Answer (Sample)', isCorrect: false }
                              ],
                              explanation: 'This is a sample explanation for demonstration purposes'
                            },
                            {
                              id: `q-sample-${Date.now()}-2`,
                              text: '[SAMPLE] True/False Question',
                              type: 'multipleChoice',
                              points: 1,
                              options: [
                                { id: `o-sample-${Date.now()}-5`, text: 'True (Sample - Correct)', isCorrect: true },
                                { id: `o-sample-${Date.now()}-6`, text: 'False (Sample)', isCorrect: false }
                              ],
                              explanation: 'This is another sample explanation'
                            }
                          ];
                          
                          console.log('[LESSON_VIEW] Creating sample quiz with questions:', JSON.stringify(sampleQuestions));
                          
                          const response = await axios.patch(`/api/courses/lessons/${lessonId}`, {
                            questions: JSON.stringify(sampleQuestions),
                            passingScore: 70,
                            timeLimit: 30
                          });
                          
                          if (response.data.status === 200) {
                            toast.success('Sample quiz created successfully. Please note this is for testing only - edit the quiz to add your real questions.', { duration: 5000 });
                            router.refresh();
                          }
                        } catch (error) {
                          console.error('Failed to create sample quiz:', error);
                          toast.error('Failed to create sample quiz');
                        }
                      }}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black"
                    >
                      Create Sample Quiz (Testing Only)
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        }
        
        return (
          <QuizLessonView
            lessonId={lessonId}
            questions={parsedQuestions}
            timeLimit={timeLimit}
            passingScore={passingScore || 70}
            userId={user?.id}
            isPreview={isPreview}
            onComplete={handleComplete}
            savedProgress={progress}
            setHasUnsavedChanges={setHasUnsavedChanges}
            courseId={courseId}
            courseTitle={title}
            sectionTitle={description}
            lessonTitle={title}
            nextLessonId={nextLessonId}
            prevLessonId={prevLessonId}
          />
        );
        
      case 'assignment':
        if (!content) {
          return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardEdit className="h-20 w-20 text-[#3A3A3A] mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Assignment Not Available</h3>
              <p className="text-[#9D9D9D] max-w-md">
                This assignment has no instructions. Please contact the course creator.
              </p>
            </div>
          );
        }
        
        return (
          <AssignmentLessonView
            lessonId={lessonId}
            instructions={content}
            userId={user?.id}
            isPreview={isPreview}
            rubric={rubric}
            dueDate={dueDate}
            fileTypes={fileTypes}
            maxFileSize={maxFileSize}
            maxFiles={maxFiles}
            onProgress={handleProgress}
            onComplete={handleComplete}
            savedProgress={progress}
            setHasUnsavedChanges={setHasUnsavedChanges}
            courseId={courseId}
            courseTitle={title}
            sectionTitle={description}
            lessonTitle={title}
            nextLessonId={nextLessonId}
            prevLessonId={prevLessonId}
          />
        );
        
      default:
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-xl font-medium text-white mb-2">Unsupported Lesson Type</h3>
            <p className="text-[#9D9D9D] max-w-md">
              This lesson type is not supported in the current version.
            </p>
          </div>
        );
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          {React.createElement(getLessonTypeIcon(), { className: "h-6 w-6 text-primary mt-1" })}
          
          <div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            {description && (
              <p className="text-[#9D9D9D] mt-1">{description}</p>
            )}
          </div>
        </div>
      </div>
      
      {renderLessonContent()}
      
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => navigateToLesson(prevLessonId || '')}
          disabled={!prevLessonId}
          className="bg-[#1A1A1A] border-[#3A3A3A] text-white hover:bg-[#2A2A2A]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous Lesson
        </Button>
        
        <Button
          onClick={() => navigateToLesson(nextLessonId || '')}
          disabled={!nextLessonId}
          className="bg-primary hover:bg-primary/90"
        >
          Next Lesson
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
} 