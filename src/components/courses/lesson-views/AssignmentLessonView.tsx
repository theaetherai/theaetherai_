'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Dispatch, SetStateAction } from 'react';
import { 
  ClipboardEdit, 
  Clock, 
  Calendar, 
  FileUp, 
  Plus, 
  X, 
  Check, 
  Upload,
  BrainCircuit,
  Sparkles,
  FileCheck,
  Lightbulb,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import axios from 'axios';
import { validateFile, validateFiles } from '@/lib/file-validation';
import LessonNavigation from './LessonNavigation';

interface RubricItem {
  criteria: string;
  description: string;
  points: number;
}

interface AssignmentLessonViewProps {
  lessonId: string;
  instructions: string;
  userId?: string;
  isPreview?: boolean;
  rubric?: RubricItem[];
  dueDate?: string;
  fileTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  savedProgress?: number;
  setHasUnsavedChanges?: Dispatch<SetStateAction<boolean>>;
  
  // Navigation props
  courseId?: string;
  courseTitle?: string;
  sectionTitle?: string;
  lessonTitle?: string;
  nextLessonId?: string;
  prevLessonId?: string;
}

export default function AssignmentLessonView({
  lessonId,
  instructions,
  userId,
  isPreview = false,
  rubric = [],
  dueDate,
  fileTypes = [],
  maxFileSize = 10,
  maxFiles = 1,
  onProgress,
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
}: AssignmentLessonViewProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [aiDraftOpen, setAiDraftOpen] = useState(false);
  const [aiDraftPrompt, setAiDraftPrompt] = useState('');
  const [aiDraftResult, setAiDraftResult] = useState('');
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [aiFeedbackOpen, setAiFeedbackOpen] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  const [aiFeedbackLoading, setAiFeedbackLoading] = useState(false);
  const [aiAssessOpen, setAiAssessOpen] = useState(false);
  const [aiAssessment, setAiAssessment] = useState('');
  const [aiAssessLoading, setAiAssessLoading] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate files using our helper
    const validation = validateFiles(
      selectedFiles,
      fileTypes,
      maxFiles - files.length, // Remaining slots
      maxFileSize
    );
    
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    
    setFiles([...files, ...selectedFiles]);
    if (setHasUnsavedChanges) {
      setHasUnsavedChanges(true);
    }
  };
  
  // Remove a file
  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    if (setHasUnsavedChanges) {
      setHasUnsavedChanges(true);
    }
  };
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Submit assignment
  const submitAssignment = async () => {
    if (!content && files.length === 0) {
      toast.error('Please add content or upload files before submitting');
      return;
    }
    
    if (!userId || isPreview) {
      toast.info('This is a preview mode. Submission is disabled.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload files if any
      const fileUrls: string[] = [];
      
      if (files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          
          const uploadResponse = await axios.post('/api/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          if (uploadResponse.data.status === 200) {
            fileUrls.push(uploadResponse.data.url);
          }
        }
      }
      
      // Submit assignment
      const submitResponse = await axios.post(`/api/courses/lessons/${lessonId}/assignment-submission`, {
        content,
        fileUrls,
      });
      
      if (submitResponse.data.status === 200) {
        setIsSubmitted(true);
        setSubmissionId(submitResponse.data.data.id);
        
        // Update progress
        await axios.post(`/api/courses/lessons/${lessonId}/progress`, {
          progress: 100,
          completed: true
        });
        
        // Reset unsaved changes flag
        if (setHasUnsavedChanges) {
          setHasUnsavedChanges(false);
        }
        
        onComplete?.();
        toast.success('Assignment submitted successfully');
      }
    } catch (err) {
      console.error('Error submitting assignment:', err);
      toast.error('Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle view submission
  const handleViewSubmission = () => {
    if (submissionId) {
      // Navigate to the submission details page
      router.push(`/courses/submissions/${submissionId}`);
    } else {
      // Fetch and view the latest submission
      router.push(`/courses/lessons/${lessonId}/submissions`);
    }
  };
  
  // Generate AI drafting assistance
  const generateAiDraft = async () => {
    if (!aiDraftPrompt.trim()) {
      toast.error('Please enter a prompt for the AI');
      return;
    }
    
    setAiDraftLoading(true);
    
    try {
      // Example AI integration
      const response = await axios.post('/api/ai/tutor', {
        prompt: aiDraftPrompt,
        context: 'assignment_draft',
        instructions: instructions
      });
      
      if (response.data.status === 200) {
        setAiDraftResult(response.data.text);
      } else {
        toast.error('Failed to generate draft');
      }
    } catch (err) {
      console.error('Error generating AI draft:', err);
      toast.error('AI service unavailable');
    } finally {
      setAiDraftLoading(false);
    }
  };
  
  // Use AI draft
  const useAiDraft = () => {
    setContent(aiDraftResult);
    setAiDraftOpen(false);
    toast.success('AI draft applied');
  };
  
  // Get AI feedback on current work
  const getAiFeedback = async () => {
    if (!content.trim()) {
      toast.error('Please add some content to get feedback on');
      return;
    }
    
    setAiFeedbackLoading(true);
    
    try {
      // Example AI feedback integration
      const response = await axios.post('/api/ai/tutor', {
        prompt: content,
        context: 'assignment_feedback',
        instructions: instructions,
        rubric: rubric
      });
      
      if (response.data.status === 200) {
        setAiFeedback(response.data.text);
      } else {
        toast.error('Failed to generate feedback');
      }
    } catch (err) {
      console.error('Error getting AI feedback:', err);
      toast.error('AI service unavailable');
    } finally {
      setAiFeedbackLoading(false);
    }
  };
  
  // Get AI self-assessment
  const getAiAssessment = async () => {
    if (!content.trim()) {
      toast.error('Please add some content to assess');
      return;
    }
    
    setAiAssessLoading(true);
    
    try {
      // Example AI assessment integration with rubric
      const response = await axios.post('/api/ai/tutor', {
        prompt: content,
        context: 'assignment_assessment',
        instructions: instructions,
        rubric: rubric
      });
      
      if (response.data.status === 200) {
        setAiAssessment(response.data.text);
      } else {
        toast.error('Failed to generate assessment');
      }
    } catch (err) {
      console.error('Error getting AI assessment:', err);
      toast.error('AI service unavailable');
    } finally {
      setAiAssessLoading(false);
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
      
      {/* Assignment Header */}
      <div className="flex items-center justify-between bg-card p-4 rounded-t-lg border border-border elevation-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Assignment</span>
          <Separator orientation="vertical" className="h-4 bg-border" />
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {dueDate && (
              <Badge className="bg-muted text-muted-foreground">
                Due {dueDate}
              </Badge>
            )}
          </div>
        </div>
        
        {isSubmitted ? (
          <Badge className="bg-green-500/20 text-green-400">
            Submitted
          </Badge>
        ) : savedProgress > 0 ? (
          <Badge className="bg-primary/20 text-primary">
            Draft Saved
          </Badge>
        ) : (
          <Badge className="bg-muted text-muted-foreground hover:bg-muted/80">
            Not Started
          </Badge>
        )}
      </div>
      
      {/* Instructions */}
      <div className="bg-card border border-t-0 border-border p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Instructions</h3>
        <div 
          className="prose prose-invert max-w-none prose-headings:text-foreground prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: instructions }}
        />
      </div>
      
      {/* AI Assistance Options */}
      {!isSubmitted && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* AI Drafting */}
          <Card className="border-border bg-card overflow-hidden hover:border-primary/50 transition-colors elevation-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-primary" />
                AI Draft Assistance
              </CardTitle>
              <CardDescription>
                Get help with starting your assignment
              </CardDescription>
            </CardHeader>
            <CardFooter className="pt-0">
              <Dialog open={aiDraftOpen} onOpenChange={setAiDraftOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-background border-border w-full">
                    <Sparkles className="h-4 w-4 mr-2 text-primary" />
                    Generate Draft
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border border-border text-white">
                  <DialogHeader>
                    <DialogTitle>AI Draft Assistance</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Describe what you'd like help with and the AI will generate a draft.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <Textarea
                      placeholder="I need help with..."
                      value={aiDraftPrompt}
                      onChange={(e) => setAiDraftPrompt(e.target.value)}
                      className="min-h-24 bg-muted border-border"
                    />
                    
                    {aiDraftResult && (
                      <div className="bg-muted border border-border rounded-md p-4 max-h-[300px] overflow-y-auto">
                        <div className="prose prose-invert max-w-none text-sm">
                          {aiDraftResult}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setAiDraftOpen(false)}
                      className="bg-background border-border"
                    >
                      Cancel
                    </Button>
                    
                    {aiDraftResult ? (
                      <Button onClick={useAiDraft} className="bg-primary">
                        <Check className="h-4 w-4 mr-2" />
                        Use This Draft
                      </Button>
                    ) : (
                      <Button onClick={generateAiDraft} disabled={aiDraftLoading} className="bg-primary">
                        {aiDraftLoading ? (
                          <>
                            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate
                          </>
                        )}
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
          
          {/* AI Feedback */}
          <Card className="border-border bg-card overflow-hidden hover:border-primary/50 transition-colors elevation-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-primary" />
                Real-time Feedback
              </CardTitle>
              <CardDescription>
                Get AI feedback on your current work
              </CardDescription>
            </CardHeader>
            <CardFooter className="pt-0">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="bg-background border-border w-full">
                    <Lightbulb className="h-4 w-4 mr-2 text-primary" />
                    Get Feedback
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[350px] bg-card border border-border text-white">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">AI Feedback</h4>
                    
                    {aiFeedback ? (
                      <div className="text-sm text-muted-foreground bg-muted rounded-md p-3 max-h-[200px] overflow-y-auto">
                        {aiFeedback}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-xs">
                        Get personalized feedback on your current work in progress.
                      </p>
                    )}
                    
                    <Button 
                      onClick={getAiFeedback} 
                      disabled={aiFeedbackLoading || !content.trim()} 
                      className="w-full bg-primary"
                    >
                      {aiFeedbackLoading ? (
                        <>
                          <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                          Analyzing...
                        </>
                      ) : (
                        'Get AI Feedback'
                      )}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </CardFooter>
          </Card>
          
          {/* AI Self-Assessment */}
          <Card className="border-border bg-card overflow-hidden hover:border-primary/50 transition-colors elevation-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Pre-submission Check
              </CardTitle>
              <CardDescription>
                AI assessment before final submission
              </CardDescription>
            </CardHeader>
            <CardFooter className="pt-0">
              <Dialog open={aiAssessOpen} onOpenChange={setAiAssessOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-background border-border w-full">
                    Review Before Submit
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border border-border text-white">
                  <DialogHeader>
                    <DialogTitle>AI Self-Assessment</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Get an AI assessment of your work before final submission.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    {aiAssessment ? (
                      <div className="bg-muted border border-border rounded-md p-4 max-h-[300px] overflow-y-auto prose prose-invert max-w-none text-sm">
                        <div dangerouslySetInnerHTML={{ __html: aiAssessment }} />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 py-6">
                        <Sparkles className="h-10 w-10 text-primary/60" />
                        <p className="text-center text-muted-foreground">
                          The AI will evaluate your work against the assignment rubric and provide suggestions for improvement.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setAiAssessOpen(false)}
                      className="bg-background border-border"
                    >
                      Close
                    </Button>
                    
                    <Button 
                      onClick={getAiAssessment} 
                      disabled={aiAssessLoading || !content.trim()} 
                      className="bg-primary"
                    >
                      {aiAssessLoading ? (
                        <>
                          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                          Assessing...
                        </>
                      ) : (
                        'Assess My Work'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </div>
      )}
      
      {/* Submission Form */}
      {!isSubmitted ? (
        <div className="bg-card border border-border rounded-lg p-6 space-y-6 elevation-2">
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">Your Submission</h3>
            <p className="text-muted-foreground">
              Enter your assignment response and/or upload files below.
            </p>
          </div>
          
          {/* Text submission */}
          <div className="space-y-2">
            <label htmlFor="content" className="text-foreground">
              Content
            </label>
            <Textarea
              id="content"
              placeholder="Enter your submission text here..."
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (setHasUnsavedChanges) {
                  setHasUnsavedChanges(true);
                }
              }}
              className="min-h-32 bg-background border-border"
              disabled={isSubmitting}
            />
          </div>
          
          {/* File uploads */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-foreground">Attachments</label>
              <span className="text-xs text-muted-foreground">
                {files.length} / {maxFiles} files
              </span>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple={maxFiles > 1}
              disabled={isSubmitting || files.length >= maxFiles}
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting || files.length >= maxFiles}
              className="w-full h-24 border-dashed border-2 border-border bg-background hover:bg-muted flex flex-col items-center justify-center gap-2"
            >
              <FileUp className="h-6 w-6 text-muted-foreground" />
              <span className="text-muted-foreground">
                {fileTypes.length > 0 
                  ? `Upload files (${fileTypes.join(', ')})`
                  : 'Upload files'}
              </span>
              <span className="text-xs text-muted-foreground">
                Max {maxFileSize}MB per file
              </span>
            </Button>
            
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-md border border-border"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <FileUp className="h-4 w-4 text-primary" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-foreground truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      disabled={isSubmitting}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-border"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Submit button */}
          <Button
            type="button"
            onClick={submitAssignment}
            disabled={isSubmitting || (!content.trim() && files.length === 0)}
            className="w-full bg-primary hover:bg-primary/90 py-6"
          >
            {isSubmitting ? (
              <>
                <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                Submit Assignment
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-400" />
            </div>
            
            <h3 className="text-xl font-medium text-foreground mb-2">
              Assignment Submitted
            </h3>
            
            <p className="text-muted-foreground max-w-md mb-4">
              Your assignment has been submitted successfully. You'll receive feedback once it's been reviewed.
            </p>
            
            <Button
              variant="outline"
              onClick={handleViewSubmission}
              className="bg-background border-border hover:bg-border"
            >
              View Submission
            </Button>
          </div>
        </div>
      )}
      
      {/* Rubric */}
      {rubric.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="border-b border-border p-4">
            <h3 className="font-medium text-foreground">Grading Rubric</h3>
          </div>
          
          <div className="p-4">
            <div className="space-y-4">
              {rubric.map((item, index) => (
                <div 
                  key={index}
                  className="p-4 bg-muted rounded-lg border border-border"
                >
                  <div className="flex justify-between mb-2">
                    <h4 className="font-medium text-foreground">{item.criteria}</h4>
                    <Badge className="bg-primary/20 text-primary">
                      {item.points} points
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground text-sm">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 