'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator, Plus, Save, Trash, Loader2 } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import { useRouteAvailability } from '@/hooks/useRouteAvailability'
import { FeatureCheck } from '@/components/ui/feature-check'
import { FeatureUnavailableMessage } from '@/components/ui/feature-unavailable-message'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface QuizQuestion {
  id: string
  text: string
  options: {
    id: string
    text: string
    isCorrect: boolean
  }[]
  explanation: string
}

interface QuizLessonEditorProps {
  lessonId: string
  courseId: string
  initialData?: {
    title: string
    description?: string | null
    questions?: QuizQuestion[];
    passingScore?: number;
    timeLimit?: number;
    previewable: boolean
  }
  onSave: () => void
  onCancel: () => void
}

export default function QuizLessonEditor({
  lessonId,
  courseId,
  initialData,
  onSave,
  onCancel
}: QuizLessonEditorProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => {
    // Log how we're loading initial questions
    console.log('[QUIZ_EDITOR_INIT] Initial questions data type:', 
      initialData?.questions ? typeof initialData.questions : 'undefined');
    
    if (initialData?.questions) {
      console.log('[QUIZ_EDITOR_INIT] Initial questions raw format:', 
        Array.isArray(initialData.questions) 
          ? `Array with ${initialData.questions.length} items` 
          : JSON.stringify(initialData.questions).substring(0, 100) + '...');
      
      if (typeof initialData.questions === 'string') {
        try {
          // Try to parse string questions
          const parsed = JSON.parse(initialData.questions);
          console.log('[QUIZ_EDITOR_INIT] Successfully parsed questions string, found', 
            Array.isArray(parsed) ? parsed.length : 'non-array data');
          return parsed;
        } catch (e) {
          console.error('[QUIZ_EDITOR_INIT] Error parsing questions string:', e);
          return [];
        }
      }
      return initialData.questions;
    }
    return [];
  })
  const [passingScore, setPassingScore] = useState(() => {
    // Ensure passing score is initialized as a number
    if (initialData?.passingScore) {
      console.log('[QUIZ_EDITOR_INIT] Initializing passingScore:', initialData.passingScore, 'type:', typeof initialData.passingScore);
      return initialData.passingScore.toString();
    }
    return '70';
  })
  const [timeLimit, setTimeLimit] = useState(() => {
    // Ensure time limit is initialized as a number
    if (initialData?.timeLimit) {
      console.log('[QUIZ_EDITOR_INIT] Initializing timeLimit:', initialData.timeLimit, 'type:', typeof initialData.timeLimit);
      return initialData.timeLimit.toString();
    }
    return '30';
  })
  const [previewable, setPreviewable] = useState(initialData?.previewable || false)
  const [loading, setLoading] = useState(false)
  const { checkRouteExists } = useRouteAvailability()
  const [quizSubmissionAvailable, setQuizSubmissionAvailable] = useState<boolean | null>(null)
  
  // Add state to track if the form has been modified to prevent accidental navigation
  const [isFormModified, setIsFormModified] = useState(false)
  
  // Disable form submission by default
  useEffect(() => {
    const formElement = formRef.current
    
    if (formElement) {
      const handleSubmit = (e: Event) => {
        // Always prevent default form submission
        e.preventDefault()
        e.stopPropagation()
        console.log('Prevented automatic form submission')
      }
      
      formElement.addEventListener('submit', handleSubmit, true)
      
      return () => {
        formElement.removeEventListener('submit', handleSubmit, true)
      }
    }
  }, [])
  
  // Disable browser back/navigation when form is modified
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormModified) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isFormModified])
  
  useEffect(() => {
    // Check if quiz submission endpoint exists
    checkRouteExists(`/api/courses/lessons/${lessonId}/quiz-attempt`).then(exists => {
      setQuizSubmissionAvailable(exists)
    })
  }, [lessonId, checkRouteExists])
  
  const markFormAsModified = () => {
    if (!isFormModified) {
      setIsFormModified(true)
    }
  }
  
  // ===== Question Management Functions =====
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q-${Date.now()}`,
      text: '',
      options: [
        { id: `o-${Date.now()}-1`, text: '', isCorrect: false },
        { id: `o-${Date.now()}-2`, text: '', isCorrect: false },
        { id: `o-${Date.now()}-3`, text: '', isCorrect: false },
        { id: `o-${Date.now()}-4`, text: '', isCorrect: false }
      ],
      explanation: ''
    }
    setQuestions([...questions, newQuestion])
    markFormAsModified()
  }
  
  const removeQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId))
    markFormAsModified()
  }
  
  const updateQuestionText = (questionId: string, text: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, text } : q
    ))
    markFormAsModified()
  }
  
  const updateOptionText = (questionId: string, optionId: string, text: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options.map(o => 
              o.id === optionId ? { ...o, text } : o
            ) 
          } 
        : q
    ))
    markFormAsModified()
  }
  
  const updateCorrectOption = (questionId: string, optionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options.map(o => 
              ({ ...o, isCorrect: o.id === optionId })
            ) 
          } 
        : q
    ))
    markFormAsModified()
  }
  
  const updateExplanation = (questionId: string, explanation: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, explanation } : q
    ))
    markFormAsModified()
  }
  
  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: [
              ...q.options, 
              { id: `o-${Date.now()}`, text: '', isCorrect: false }
            ] 
          } 
        : q
    ))
    markFormAsModified()
  }
  
  const removeOption = (questionId: string, optionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options.filter(o => o.id !== optionId) 
          } 
        : q
    ))
    markFormAsModified()
  }
  
  // Handle form input changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    markFormAsModified()
  }
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value)
    markFormAsModified()
  }
  
  const handlePassingScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Make sure the value is a valid number between 1 and 100
    const value = e.target.value;
    const numValue = parseInt(value);
    
    if (value === '' || (numValue >= 1 && numValue <= 100)) {
      setPassingScore(value);
      markFormAsModified();
      console.log('[QUIZ_EDITOR] passingScore changed to:', value);
    }
  }
  
  const handleTimeLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Make sure the value is a valid number greater than or equal to 1
    const value = e.target.value;
    const numValue = parseInt(value);
    
    if (value === '' || (numValue >= 1)) {
      setTimeLimit(value);
      markFormAsModified();
      console.log('[QUIZ_EDITOR] timeLimit changed to:', value);
    }
  }
  
  const handlePreviewableChange = (checked: boolean) => {
    setPreviewable(checked)
    markFormAsModified()
  }
  
  // Check if a question is a sample question
  const isSampleQuestion = (question: any): boolean => {
    return question.id?.includes('sample') || 
           question.text?.includes('Sample Question') || 
           question.text?.includes('[SAMPLE]');
  };

  // Check if the current questions are sample questions
  const hasSampleQuestions = (questionsArray: QuizQuestion[]): boolean => {
    return questionsArray.some(q => isSampleQuestion(q));
  };

  // Update the initialData handling to detect sample questions
  useEffect(() => {
    if (initialData?.questions) {
      let dataQuestions = initialData.questions;
      
      try {
        // Parse questions if they're a string
        if (typeof dataQuestions === 'string') {
          dataQuestions = JSON.parse(dataQuestions);
        }
        
        // Check if these are sample questions
        if (Array.isArray(dataQuestions) && dataQuestions.length > 0) {
          const containsSamples = hasSampleQuestions(dataQuestions);
          
          if (containsSamples) {
            console.log('[QUIZ_EDITOR] Detected sample questions from initialization - these will be replaced when you save');
            // Show a notification to the user
            toast.info('This quiz contains sample questions. Your changes will replace these sample questions when you save.', {
              duration: 5000,
              id: 'sample-questions-warning'
            });
          }
        }
      } catch (err) {
        console.error('[QUIZ_EDITOR] Error parsing initial questions:', err);
      }
    }
  }, [initialData]);
  
  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    console.log('[QUIZ_EDITOR_SUBMIT] Starting quiz submission')
    console.log('[QUIZ_EDITOR_SUBMIT] Questions array length:', questions.length)
    
    // Check if we're replacing sample questions with more thorough detection
    const hasSamples = questions.some(q => 
      q.id?.includes('sample') || 
      q.id?.includes('q-') || 
      q.text?.includes('Sample Question') ||
      q.text?.includes('[SAMPLE]')
    );
    
    if (hasSamples) {
      console.log('[QUIZ_EDITOR_SUBMIT] Detected sample questions that will be replaced');
      console.log('[QUIZ_EDITOR_SUBMIT] Sample question IDs:', questions.map(q => q.id).join(', '));
      const shouldContinue = confirm('You are about to replace sample questions with your custom ones. This will permanently delete the sample questions. Continue?');
      if (!shouldContinue) {
        console.log('[QUIZ_EDITOR_SUBMIT] User cancelled replacing sample questions');
        toast.info('Cancelled. Sample questions were not replaced.');
        return;
      }
    }
    
    // Validation checks
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    
    if (questions.length === 0) {
      toast.error('Add at least one question')
      return
    }
    
    // Validate passing score
    const parsedPassingScore = parseInt(passingScore);
    if (isNaN(parsedPassingScore) || parsedPassingScore < 1 || parsedPassingScore > 100) {
      toast.error('Passing score must be a number between 1 and 100')
      return
    }
    
    // Validate time limit
    const parsedTimeLimit = parseInt(timeLimit);
    if (isNaN(parsedTimeLimit) || parsedTimeLimit < 1) {
      toast.error('Time limit must be a positive number')
      return
    }
    
    // Validate questions
    for (const q of questions) {
      if (!q.text.trim()) {
        toast.error('All questions must have text')
        return
      }
      
      if (q.options.length < 2) {
        toast.error('Each question must have at least 2 options')
        return
      }
      
      if (!q.options.some(o => o.isCorrect)) {
        toast.error('Each question must have at least one correct answer')
        return
      }
      
      for (const o of q.options) {
        if (!o.text.trim()) {
          toast.error('All options must have text')
          return
        }
      }
    }
    
    console.log('[QUIZ_EDITOR_SUBMIT] Submitting quiz with questions:', questions.length)
    
    // Generate a single timestamp for all IDs to ensure consistency
    const timestamp = Date.now();
    
    // ALWAYS create new IDs for questions and options to ensure they're unique
    // and don't retain any sample question IDs
    const formattedQuestions = questions.map((q, index) => {
      // Always create a new custom ID regardless of existing ID
      const questionId = `custom-q-${timestamp}-${index}`;
      
      // Process options to ensure they have proper IDs too
      const processedOptions = q.options.map((opt, optIndex) => ({
        ...opt,
        id: `custom-o-${timestamp}-${index}-${optIndex}`
      }));
      
      return {
        ...q,
        id: questionId,
        options: processedOptions,
        type: 'multipleChoice',
        points: 1
      };
    });
    
    console.log('[QUIZ_EDITOR_SUBMIT] First raw question:', JSON.stringify(questions[0], null, 2))
    console.log('[QUIZ_EDITOR_SUBMIT] First formatted question:', JSON.stringify(formattedQuestions[0], null, 2))
    
    const questionsJson = JSON.stringify(formattedQuestions)
    console.log('[QUIZ_EDITOR_SUBMIT] Questions JSON length:', questionsJson.length)
    console.log('[QUIZ_EDITOR_SUBMIT] Questions JSON preview:', questionsJson.substring(0, 300) + '...')
    
    setLoading(true)
    
    try {
      // Create the update payload and log it completely
      const updatePayload = {
        title,
        description,
        type: 'quiz',
        questions: questionsJson,
        passingScore: parseInt(passingScore),
        timeLimit: parseInt(timeLimit),
        previewable
      };
      
      // Ensure numbers are properly stored as numbers
      console.log('[QUIZ_EDITOR_SUBMIT] FULL PATCH PAYLOAD:', JSON.stringify(updatePayload, null, 2));
      console.log('[QUIZ_EDITOR_SUBMIT] passingScore type:', typeof updatePayload.passingScore, 'value:', updatePayload.passingScore);
      console.log('[QUIZ_EDITOR_SUBMIT] timeLimit type:', typeof updatePayload.timeLimit, 'value:', updatePayload.timeLimit);
      
      // Use a more modern approach to ensure reliable submission
      const response = await fetch(`/api/courses/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });
      
      const data = await response.json();
      console.log('[QUIZ_EDITOR_SUBMIT] API response status:', response.status);
      console.log('[QUIZ_EDITOR_SUBMIT] API response data:', data);
      
      if (response.ok) {
        console.log('[QUIZ_EDITOR_SUBMIT] Quiz updated successfully');
        
        // Verify the saved questions in the response
        const savedQuestions = data.data?.questions;
        if (savedQuestions) {
          console.log('[QUIZ_EDITOR_SUBMIT] Saved questions type:', typeof savedQuestions);
          if (typeof savedQuestions === 'string') {
            try {
              const parsedSaved = JSON.parse(savedQuestions);
              console.log('[QUIZ_EDITOR_SUBMIT] Parsed saved questions count:', 
                Array.isArray(parsedSaved) ? parsedSaved.length : 'not an array');
              if (Array.isArray(parsedSaved) && parsedSaved.length > 0) {
                console.log('[QUIZ_EDITOR_SUBMIT] First saved question:', JSON.stringify(parsedSaved[0], null, 2));
                
                // Check if we still have sample questions
                const stillHasSamples = hasSampleQuestions(parsedSaved);
                if (stillHasSamples) {
                  console.warn('[QUIZ_EDITOR_SUBMIT] Warning: Sample questions still detected in saved data');
                } else {
                  console.log('[QUIZ_EDITOR_SUBMIT] Custom questions saved successfully');
                }
              }
            } catch (err) {
              console.error('[QUIZ_EDITOR_SUBMIT] Error parsing saved questions:', err);
            }
          }
        } else {
          console.warn('[QUIZ_EDITOR_SUBMIT] No questions in the response data');
        }
        
        toast.success('Quiz updated successfully')
        setIsFormModified(false)
        setLoading(false)
        
        // Ask user if they want to continue editing or go back to course page
        if (confirm('Quiz updated successfully. Do you want to continue editing?')) {
          console.log('[QUIZ_EDITOR_SUBMIT] User chose to continue editing')
          // Stay on the page - don't call onSave
        } else {
          console.log('[QUIZ_EDITOR_SUBMIT] User chose to navigate away')
          // Only navigate away if the user chooses to
          onSave()
        }
      } else {
        console.error('[QUIZ_EDITOR_SUBMIT] Failed to update quiz:', data.error || 'Server error');
        toast.error('Failed to update quiz: ' + (data.error || 'Server error'));
        setLoading(false);
      }
    } catch (error) {
      console.error('[QUIZ_EDITOR_SUBMIT] Failed to update quiz:', error)
      toast.error('Failed to update quiz: Network or server error')
      setLoading(false)
    }
  }
  
  // Handle cancel with confirmation if form is modified
  const handleCancel = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    if (isFormModified) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onCancel()
      }
    } else {
      onCancel()
    }
  }

  return (
    <Card className="bg-card border-border elevation-3 animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Calculator className="h-5 w-5 text-primary" />
          Edit Quiz Lesson
        </CardTitle>
      </CardHeader>
      <form 
        ref={formRef}
        onSubmit={handleSubmit}
      >
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="title" className="text-foreground mb-2 block">Quiz Title</Label>
            <Input
              id="title"
              value={title}
              onChange={handleTitleChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
              placeholder="Enter quiz title"
              className="bg-background border-border text-foreground"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description" className="text-foreground mb-2 block">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
              placeholder="Brief description of this quiz"
              className="h-20 bg-background border-border text-foreground"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="passingScore" className="text-foreground mb-2 block">Passing Score (%)</Label>
              <Input
                id="passingScore"
                type="number"
                value={passingScore}
                onChange={handlePassingScoreChange}
                min="1"
                max="100"
                className={cn(
                  "bg-background border-border text-foreground",
                  passingScore && (parseInt(passingScore) < 1 || parseInt(passingScore) > 100 || isNaN(parseInt(passingScore))) 
                    ? "border-red-500 focus:border-red-500" 
                    : ""
                )}
              />
              <p className={cn(
                "text-xs mt-1",
                passingScore && (parseInt(passingScore) < 1 || parseInt(passingScore) > 100 || isNaN(parseInt(passingScore))) 
                  ? "text-red-500" 
                  : "text-muted-foreground"
              )}>
                {passingScore && (parseInt(passingScore) < 1 || parseInt(passingScore) > 100 || isNaN(parseInt(passingScore)))
                  ? "Must be a number between 1 and 100"
                  : "Minimum percentage required to pass this quiz (1-100)"}
              </p>
            </div>
            
            <div>
              <Label htmlFor="timeLimit" className="text-foreground mb-2 block">Time Limit (minutes)</Label>
              <Input
                id="timeLimit"
                type="number"
                value={timeLimit}
                onChange={handleTimeLimitChange}
                min="1"
                className={cn(
                  "bg-background border-border text-foreground",
                  timeLimit && (parseInt(timeLimit) < 1 || isNaN(parseInt(timeLimit))) 
                    ? "border-red-500 focus:border-red-500" 
                    : ""
                )}
              />
              <p className={cn(
                "text-xs mt-1",
                timeLimit && (parseInt(timeLimit) < 1 || isNaN(parseInt(timeLimit))) 
                  ? "text-red-500" 
                  : "text-muted-foreground"
              )}>
                {timeLimit && (parseInt(timeLimit) < 1 || isNaN(parseInt(timeLimit)))
                  ? "Must be a positive number"
                  : "Time allowed to complete this quiz (in minutes)"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mt-4">
            <Checkbox 
              id="previewable" 
              checked={previewable}
              onCheckedChange={handlePreviewableChange}
              className="bg-background border-border text-foreground"
            />
            <label
              htmlFor="previewable"
              className="text-sm text-foreground font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Available in free preview
            </label>
          </div>
          
          <div className="border-t border-border pt-6">
            <div className="flex justify-between items-center mb-4">
              <Label className="text-foreground text-lg">Quiz Questions</Label>
              <Button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  addQuestion();
                }}
                variant="outline"
                className="bg-background border-border text-foreground hover:bg-muted"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Question
              </Button>
            </div>
            
            <FeatureCheck
              route={`/api/courses/lessons/${lessonId}/quiz-attempt`}
              fallback={
                <FeatureUnavailableMessage
                  title="Quiz Feature Not Fully Implemented"
                  description="The quiz submission API is not yet available. Students will see the questions but won't be able to submit answers yet."
                  type="quiz"
                />
              }
            >
              {questions.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No questions added yet. Add at least one question to create a quiz.
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((question, qIndex) => (
                    <div 
                      key={question.id} 
                      className="p-4 border border-border rounded-md bg-background"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-foreground font-medium">Question {qIndex + 1}</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={(e) => {
                            e.preventDefault();
                            removeQuestion(question.id);
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/30 -mt-1 h-8 px-2"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="mb-4">
                        <Input
                          value={question.text}
                          onChange={(e) => {
                            updateQuestionText(question.id, e.target.value)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              e.stopPropagation()
                            }
                          }}
                          placeholder="Enter question text"
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      
                      <Label className="text-foreground mb-2 block">Options</Label>
                      <div className="space-y-2 mb-4">
                        {question.options.map((option) => (
                          <div key={option.id} className="flex items-center gap-2">
                            <Checkbox 
                              checked={option.isCorrect}
                              onCheckedChange={() => {
                                updateCorrectOption(question.id, option.id)
                              }}
                              className="bg-background border-border text-green-500"
                            />
                            <Input
                              value={option.text}
                              onChange={(e) => {
                                updateOptionText(question.id, option.id, e.target.value)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }
                              }}
                              placeholder="Option text"
                              className="flex-1 bg-background border-border text-foreground"
                            />
                            {question.options.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeOption(question.id, option.id);
                                }}
                                className="text-red-400 hover:text-red-300 hover:bg-red-950/30 h-8 w-8 p-0"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {question.options.length < 6 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            addOption(question.id);
                          }}
                          className="mb-4 text-sm bg-background border-border text-foreground hover:bg-muted"
                          size="sm"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Option
                        </Button>
                      )}
                      
                      <Label htmlFor={`explanation-${question.id}`} className="text-foreground mb-2 block">
                        Explanation (shown after answering)
                      </Label>
                      <Textarea
                        id={`explanation-${question.id}`}
                        value={question.explanation}
                        onChange={(e) => {
                          updateExplanation(question.id, e.target.value)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            e.preventDefault()
                            e.stopPropagation()
                          }
                        }}
                        placeholder="Explain the correct answer..."
                        className="h-20 bg-background border-border text-foreground"
                      />
                    </div>
                  ))}
                </div>
              )}
            </FeatureCheck>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={(e) => handleCancel(e)} 
            disabled={loading}
            className="bg-background border-border text-foreground hover:bg-muted/50"
          >
            Cancel
          </Button>
          
          <FeatureCheck
            route={`/api/courses/lessons/${lessonId}/quiz-attempt`}
            fallback={
              <FeatureUnavailableMessage
                title="Quiz Editor Feature"
                description="The quiz submission feature is still under development. Check back soon!"
                type="coming-soon"
                action={
                  <Button
                    type="button" 
                    onClick={(e) => handleCancel(e)}
                    className="bg-background hover:bg-muted text-foreground"
                  >
                    Go Back
                  </Button>
                }
              />
            }
          >
            <Button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit(e);
              }}
              disabled={loading}
              className={cn(
                "relative overflow-hidden",
                (passingScore && (parseInt(passingScore) < 1 || parseInt(passingScore) > 100 || isNaN(parseInt(passingScore)))) ||
                (timeLimit && (parseInt(timeLimit) < 1 || isNaN(parseInt(timeLimit)))) ||
                questions.length === 0
                  ? "bg-primary/50 hover:bg-primary/60 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving Quiz...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> 
                  Save Quiz
                </>
              )}
            </Button>
          </FeatureCheck>
        </CardFooter>
      </form>
    </Card>
  )
} 