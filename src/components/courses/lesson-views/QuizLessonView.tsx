'use client';

import { useState, useEffect } from 'react';
import { 
  FileQuestion, 
  Check, 
  X, 
  ArrowRight, 
  Undo2, 
  RotateCcw, 
  Clock,
  Award,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { Dispatch, SetStateAction } from 'react';
import LessonNavigation from './LessonNavigation';
import { useRouter } from 'next/navigation';

interface QuizQuestion {
  id: string;
  text: string;
  explanation?: string;
  type: 'multipleChoice' | 'trueFalse' | 'shortAnswer' | 'essay';
  points: number;
  options?: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

interface QuizLessonViewProps {
  lessonId: string;
  questions: QuizQuestion[];
  timeLimit?: number; // In minutes
  passingScore?: number; // Percentage
  userId?: string;
  isPreview?: boolean;
  onComplete?: (score: number) => void;
  savedProgress?: number; // If the user has attempted the quiz before
  setHasUnsavedChanges?: Dispatch<SetStateAction<boolean>>;
  // Navigation props
  courseId?: string;
  courseTitle?: string;
  sectionTitle?: string;
  lessonTitle?: string;
  nextLessonId?: string;
  prevLessonId?: string;
}

export default function QuizLessonView({
  lessonId,
  questions,
  timeLimit,
  passingScore = 70,
  userId,
  isPreview = false,
  onComplete,
  savedProgress = 0,
  setHasUnsavedChanges,
  // Navigation props
  courseId,
  courseTitle,
  sectionTitle,
  lessonTitle,
  nextLessonId,
  prevLessonId
}: QuizLessonViewProps) {
  // Initialize state from localStorage if available
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedAnswers = localStorage.getItem(`quiz_answers_${lessonId}`);
        if (savedAnswers) {
          console.log('Loading saved answers from localStorage:', savedAnswers);
          return JSON.parse(savedAnswers);
        }
      } catch (e) {
        console.error('Error loading saved answers:', e);
        // Clear corrupted storage
        localStorage.removeItem(`quiz_answers_${lessonId}`);
      }
    }
    // Initialize with an empty object
    return {};
  });
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(() => {
    if (typeof window !== 'undefined' && timeLimit) {
      const savedTime = localStorage.getItem(`quiz_timer_${lessonId}`);
      return savedTime ? parseInt(savedTime, 10) : timeLimit * 60;
    }
    return timeLimit ? timeLimit * 60 : 0;
  });
  const [timerActive, setTimerActive] = useState(!!timeLimit);
  
  const router = useRouter();
  
  // Persist answers to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`quiz_answers_${lessonId}`, JSON.stringify(answers));
    }
  }, [answers, lessonId]);
  
  // Persist timer to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && timeLimit) {
      localStorage.setItem(`quiz_timer_${lessonId}`, timeLeft.toString());
    }
  }, [timeLeft, lessonId, timeLimit]);
  
  // Clear localStorage when quiz is submitted or restarted
  useEffect(() => {
    if (isSubmitted && typeof window !== 'undefined') {
      localStorage.removeItem(`quiz_timer_${lessonId}`);
    }
  }, [isSubmitted, lessonId]);
  
  // Timer functionality
  useEffect(() => {
    if (!timerActive || !timeLimit) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          submitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timerActive, timeLimit]);
  
  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Handle answer change
  const handleAnswer = (questionId: string, value: any) => {
    // Use functional update to ensure we're working with the latest state
    setAnswers(prev => {
      // Create a completely new object to ensure React sees the change
      const newAnswers = { ...prev };
      
      // Set the answer directly
      newAnswers[questionId] = value;
      
      // Set unsaved changes flag if we have a setter
      if (setHasUnsavedChanges) {
        setHasUnsavedChanges(true);
      }
      
      // Store in localStorage immediately
      if (typeof window !== 'undefined') {
        localStorage.setItem(`quiz_answers_${lessonId}`, JSON.stringify(newAnswers));
      }
      
      return newAnswers;
    });
  };
  
  // Move to next question
  const goToNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsReviewing(true);
    }
  };
  
  // Move to previous question during review
  const goToPrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };
  
  // Jump to a specific question during review
  const jumpToQuestion = (index: number) => {
    setCurrentQuestion(index);
  };
  
  // Submit the quiz
  const submitQuiz = async () => {
    // Check if all required questions are answered
    const unansweredQuestions = questions.filter(question => {
      // Skip checks for short answers and essays
      if (question.type === 'shortAnswer' || question.type === 'essay') {
        return false;
      }
      
      // Strict check for undefined, null, or empty string
      return answers[question.id] === undefined || answers[question.id] === null || answers[question.id] === '';
    });
    
    if (unansweredQuestions.length > 0) {
      toast.error(`Please answer all questions before submitting. ${unansweredQuestions.length} question(s) unanswered.`);
      return;
    }

    // Ask for confirmation before submitting
    if (!confirm("Are you sure you want to submit your quiz? You won't be able to change your answers after submission.")) {
      return;
    }

    // Calculate score
    let correctAnswers = 0;
    let totalPoints = 0;
    
    const scoredAnswers = questions.map(question => {
      let isCorrect = false;
      
      if (question.type === 'multipleChoice' || question.type === 'trueFalse') {
        const selectedOptionId = answers[question.id];
        
        // Find the correct option
        const correctOption = question.options?.find(o => o.isCorrect);
        if (!correctOption) {
          return { questionId: question.id, answer: selectedOptionId, isCorrect: false, points: 0 };
        }
        
        // Get the correct option ID using the same logic as in the rendering
        const correctOptionId = correctOption.id || 
          `option-${question.options?.findIndex(o => o === correctOption)}-${question.id}`;
        
        // Compare the selected option with the correct option
        isCorrect = selectedOptionId === correctOptionId;
      } else {
        // For short answer and essay, no automatic grading
        isCorrect = false;
      }
      
      if (isCorrect) {
        correctAnswers++;
        totalPoints += question.points;
      }
      
      return {
        questionId: question.id,
        answer: answers[question.id],
        isCorrect,
        points: isCorrect ? question.points : 0
      };
    });
    
    const totalPossiblePoints = questions.reduce((sum, q) => sum + q.points, 0);
    const scorePercentage = Math.round((totalPoints / totalPossiblePoints) * 100);
    setScore(scorePercentage);
    
    // Mark as complete and sync with server
    if (userId && !isPreview) {
      try {
        await axios.post(`/api/courses/lessons/${lessonId}/quiz-attempt`, {
          answers: scoredAnswers,
          score: scorePercentage,
          passed: scorePercentage >= passingScore,
          timeSpent: timeLimit ? (timeLimit * 60) - timeLeft : null
        });
        
        // Mark the lesson as complete
        await axios.post(`/api/courses/lessons/${lessonId}/progress`, {
          progress: 100,
          completed: true
        });
      } catch (err) {
        console.error('Error saving quiz results:', err);
        toast.error('Failed to save your quiz results');
      }
    }
    
    // Reset unsaved changes flag
    if (setHasUnsavedChanges) {
      setHasUnsavedChanges(false);
    }
    
    // Clear localStorage when the quiz is submitted
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`quiz_answers_${lessonId}`);
      localStorage.removeItem(`quiz_timer_${lessonId}`);
    }
    
    setIsSubmitted(true);
    setTimerActive(false);
    onComplete?.(scorePercentage);
  };
  
  // Start a new attempt
  const restartQuiz = () => {
    // Clear localStorage for this quiz
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`quiz_answers_${lessonId}`);
      localStorage.removeItem(`quiz_timer_${lessonId}`);
    }
    
    setAnswers({});
    setCurrentQuestion(0);
    setIsReviewing(false);
    setIsSubmitted(false);
    setTimeLeft(timeLimit ? timeLimit * 60 : 0);
    setTimerActive(!!timeLimit);
  };
  
  // Get the current question
  const question = questions[currentQuestion];
  if (!question) return null;
  
  // Determine if the current question has been answered - with stricter check
  const isAnswered = (answers[question.id] !== undefined && 
                      answers[question.id] !== null && 
                      answers[question.id] !== '');
  
  // Get correct answer for the current question (after submission)
  const correctOption = isSubmitted && (question.type === 'multipleChoice' || question.type === 'trueFalse') 
    ? question.options?.find(o => o.isCorrect)
    : null;
  
  const correctAnswer = correctOption 
    ? correctOption.id || `option-${question.options?.findIndex(o => o === correctOption)}-${question.id}`
    : null;
  
  // Determine if current answer is correct (after submission)
  const isCurrentAnswerCorrect = isSubmitted 
    ? answers[question.id] === correctAnswer 
    : false;
  
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
      
      {/* Quiz content container */}
      <div>
        {/* Quiz Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-card p-4 rounded-lg border border-border gap-4 elevation-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-primary" />
            <span className="text-foreground font-medium">Quiz Assessment</span>
            
            {isSubmitted ? (
              <Badge 
                className={cn(
                  "ml-2",
                  score >= passingScore 
                    ? "bg-green-500/20 text-green-400" 
                    : "bg-destructive/20 text-destructive"
                )}
              >
                Score: {score}%
              </Badge>
            ) : (
              <Badge className="ml-2 bg-muted text-muted-foreground">
                {currentQuestion + 1} of {questions.length}
              </Badge>
            )}
          </div>
          
          {timeLimit && !isSubmitted && (
            <div className="flex items-center gap-2">
              <Clock className={cn(
                "h-4 w-4",
                timeLeft < 60 ? "text-destructive animate-pulse" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-sm font-mono",
                timeLeft < 60 ? "text-destructive" : "text-muted-foreground"
              )}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
        </div>
        
        {/* Results Summary (after submission) */}
        {isSubmitted && (
          <div className={cn(
            "rounded-lg border p-6",
            score >= passingScore 
              ? "bg-green-500/10 border-green-500/20" 
              : "bg-red-500/10 border-red-500/20"
          )}>
            <div className="flex flex-col items-center text-center">
              {score >= passingScore ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                    <Award className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-medium text-foreground mb-2">
                    Quiz Passed!
                  </h3>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                    <AlertCircle className="h-8 w-8 text-red-400" />
                  </div>
                  <h3 className="text-xl font-medium text-foreground mb-2">
                    Almost There
                  </h3>
                </>
              )}
              
              <p className="text-muted-foreground mb-4">
                You scored {score}% on this quiz. 
                {score >= passingScore 
                  ? " Great job!" 
                  : ` You need ${passingScore}% to pass.`}
              </p>
              
              <div className="w-full max-w-md mb-6">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full",
                      score >= passingScore ? "bg-green-500" : "bg-red-500"
                    )}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>{passingScore}% to pass</span>
                  <span>100%</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsReviewing(true)}
                  className="bg-background border-border hover:bg-muted text-foreground"
                >
                  <Undo2 className="h-4 w-4 mr-2" />
                  Review Answers
                </Button>
                
                <Button
                  onClick={restartQuiz}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry Quiz
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Question Navigation (for review mode) */}
        {isReviewing && (
          <div className="bg-card p-4 rounded-lg border border-border">
            <div className="flex flex-wrap gap-2">
              {questions.map((q, idx) => {
                const isAnsweredQuestion = answers[q.id] !== undefined;
                const isCorrect = isSubmitted && q.type !== 'essay' && q.type !== 'shortAnswer'
                  ? answers[q.id] === q.options?.find(o => o.isCorrect)?.id
                  : null;
                
                return (
                  <Button
                    key={q.id}
                    variant="outline"
                    size="sm"
                    onClick={() => jumpToQuestion(idx)}
                    className={cn(
                      "h-8 w-8 p-0",
                      currentQuestion === idx ? "border-primary bg-primary/20 text-primary" : "border-border bg-background",
                      isSubmitted && isCorrect && "border-green-500 bg-green-500/20 text-green-400",
                      isSubmitted && isCorrect === false && "border-destructive bg-destructive/20 text-destructive",
                    )}
                  >
                    {idx + 1}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border bg-card elevation-2">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <Badge className="bg-muted text-muted-foreground mb-2">
                    Question {currentQuestion + 1} of {questions.length}
                  </Badge>
                  
                  <Badge className="bg-primary/20 text-primary mb-2">
                    {question.points} {question.points === 1 ? 'point' : 'points'}
                  </Badge>
                </div>
                
                <CardTitle className="text-lg text-foreground">
                  {question.text}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-6">
                {/* Multiple Choice or True/False */}
                {(question.type === 'multipleChoice' || question.type === 'trueFalse') && (
                  <div className="space-y-3" role="radiogroup">
                    {question.options?.map((option, i) => {
                      // Create a consistent ID for the option if none exists
                      const optionId = option.id || `option-${i}-${question.id}`;
                      
                      // Implement strict selection check
                      const isSelected = answers[question.id] === optionId;
                      
                      return (
                        <div 
                          key={optionId}
                          className={cn(
                            "flex items-center space-x-2 p-3 rounded-lg border transition-colors",
                            isSelected ? "border-primary bg-primary/10" : "border-border bg-background",
                            isSubmitted && option.isCorrect ? "border-green-500 bg-green-500/10 text-green-500" : "",
                            isSubmitted && isSelected && !option.isCorrect ? "border-red-500 bg-red-500/10 text-red-400" : "",
                            !isSubmitted ? "cursor-pointer hover:border-primary/50" : ""
                          )}
                          onClick={(e) => {
                            if (!isSubmitted) {
                              // Prevent event bubbling and default behavior
                              e.stopPropagation();
                              e.preventDefault();
                              
                              // Set the answer explicitly using the optionId
                              handleAnswer(question.id, optionId);
                            }
                          }}
                          role="radio"
                          aria-checked={isSelected}
                        >
                          {/* Radio button visual indicator */}
                          <div className={cn(
                            "h-4 w-4 rounded-full border flex items-center justify-center",
                            isSelected ? "border-primary" : "border-muted",
                            isSubmitted && option.isCorrect ? "border-green-500" : "",
                            isSubmitted && isSelected && !option.isCorrect ? "border-red-500" : ""
                          )}>
                            {/* Only show the inner dot when this option is selected */}
                            {isSelected && !isSubmitted && (
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                            {isSubmitted && option.isCorrect && (
                              <Check className="h-3 w-3 text-green-500" />
                            )}
                            {isSubmitted && isSelected && !option.isCorrect && (
                              <X className="h-3 w-3 text-red-500" />
                            )}
                          </div>
                          
                          {/* Option text */}
                          <span className={cn(
                            "ml-2 flex-1",
                            isSelected ? "font-medium" : "",
                            isSubmitted && option.isCorrect ? "text-green-500" : "",
                            isSubmitted && isSelected && !option.isCorrect ? "text-red-500" : ""
                          )}>
                            {option.text}
                          </span>
                        </div>
                      );
                    })}
                      </div>
                )}
                
                {/* Short Answer */}
                {question.type === 'shortAnswer' && (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Enter your answer..."
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswer(question.id, e.target.value)}
                      className="min-h-24 bg-background border-border resize-none"
                      disabled={isSubmitted}
                    />
                    
                    {isSubmitted && (
                      <div className="p-4 bg-muted rounded-lg border border-border">
                        <p className="text-muted-foreground text-sm mb-2">
                          Short answers require instructor review. Check back later for your score.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Essay */}
                {question.type === 'essay' && (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Enter your essay answer..."
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswer(question.id, e.target.value)}
                      className="min-h-40 bg-background border-border"
                      disabled={isSubmitted}
                    />
                    
                    {isSubmitted && (
                      <div className="p-4 bg-muted rounded-lg border border-border">
                        <p className="text-muted-foreground text-sm mb-2">
                          Essay answers require instructor review. Check back later for your score.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Explanation (shown after submission) */}
                {isSubmitted && question.explanation && (
                  <div className="mt-6 p-4 bg-muted rounded-lg border border-border">
                    <h4 className="text-foreground font-medium mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2 text-blue-400">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4M12 8h.01"></path>
                      </svg>
                      Explanation
                    </h4>
                    <p className="text-muted-foreground">{question.explanation}</p>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="pt-4 border-t border-border flex justify-between">
                {isReviewing ? (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={goToPrevQuestion}
                      disabled={currentQuestion === 0}
                      className="bg-background border-border hover:bg-muted text-foreground"
                    >
                      Previous
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={goToNextQuestion}
                      disabled={currentQuestion === questions.length - 1}
                      className="bg-background border-border hover:bg-muted text-foreground"
                    >
                      Next
                    </Button>
                  </div>
                ) : (
                  <>
                    {isSubmitted ? (
                      <Button
                        onClick={restartQuiz}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restart Quiz
                      </Button>
                    ) : (
                      <div />
                    )}
                  </>
                )}
                
                {!isSubmitted ? (
                  isReviewing ? (
                    <Button 
                      onClick={submitQuiz}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Submit Quiz
                    </Button>
                  ) : (
                    <Button
                      onClick={goToNextQuestion}
                      // Enable the Review button on the last question even if not answered
                      disabled={!isAnswered && currentQuestion < questions.length - 1}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {currentQuestion < questions.length - 1 ? (
                        <>
                          Next Question
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Review Answers {Object.keys(answers).length < questions.length && (
                            <span className="ml-1 text-xs">({Object.keys(answers).length}/{questions.length})</span>
                          )}
                        </>
                      )}
                    </Button>
                  )
                ) : (
                  !isReviewing && (
                    <Button
                      variant="outline"
                      onClick={() => setIsReviewing(true)}
                      className="bg-background border-border hover:bg-muted text-foreground"
                    >
                      Review Answers
                    </Button>
                  )
                )}
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>
        
        {/* Quiz Progress */}
        {!isSubmitted && (
          <div className="bg-card p-4 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Quiz Progress</span>
              <span className="text-sm text-muted-foreground">
                {Object.keys(answers).length} of {questions.length} answered
              </span>
            </div>
            
            <Progress 
              value={(Object.keys(answers).length / questions.length) * 100} 
              className="h-2"
            />
          </div>
        )}
      </div>
    </div>
  );
} 