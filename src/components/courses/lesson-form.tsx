'use client'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import axios from 'axios'
import { toast } from 'sonner'
import { Loader2, Search, Film, X, Clock, FileText, FileQuestion, ClipboardEdit } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog'
import { getAllUserVideos } from '@/actions/workspace'
import { useQuery } from '@tanstack/react-query'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import LessonTypeSelector from './lesson-type-selector'
import RichTextEditor from './rich-text-editor'
import QuizBuilder from './quiz-builder'
import AssignmentBuilder from './assignment-builder'
import { cn } from '@/lib/utils'

// Form validation schema
const baseSchema = z.object({
  title: z.string().min(1, {
    message: 'Title is required.',
  }).max(100, {
    message: 'Title must be less than 100 characters.',
  }),
  content: z.string().max(5000, {
    message: 'Content must be less than 5000 characters.',
  }).optional(),
  sectionId: z.string().optional(),
  duration: z.coerce.number().int().min(0).optional(),
  previewable: z.boolean().default(false),
  type: z.enum(['video', 'text', 'quiz', 'assignment']).default('video'),
});

// Type-specific schemas
const videoSchema = baseSchema.extend({
  type: z.literal('video'),
  videoId: z.string().optional(),
});

const textSchema = baseSchema.extend({
  type: z.literal('text'),
  content: z.string().min(1, {
    message: 'Text content is required.'
  }),
});

const quizSchema = baseSchema.extend({
  type: z.literal('quiz'),
  questions: z.array(
    z.object({
      text: z.string().min(1, { message: "Question text is required" }),
      explanation: z.string().optional(),
      type: z.enum(['multipleChoice', 'trueFalse', 'shortAnswer', 'essay']),
      points: z.number().min(1),
      options: z.array(
        z.object({
          text: z.string().min(1, { message: "Option text is required" }),
          isCorrect: z.boolean(),
        })
      ).optional(),
    })
  ).optional(),
});

const assignmentSchema = baseSchema.extend({
  type: z.literal('assignment'),
  instructions: z.string().min(1, {
    message: 'Instructions are required.'
  }),
  rubric: z.array(
    z.object({
      criteria: z.string(),
      description: z.string(),
      points: z.number(),
    })
  ).optional(),
  dueDate: z.string().optional(),
  fileTypes: z.array(z.string()).default([]),
  maxFileSize: z.coerce.number().int().min(0).optional(),
  maxFiles: z.coerce.number().int().min(1).default(1),
});

// Form schema with discriminated union
const formSchema = z.discriminatedUnion('type', [
  videoSchema,
  textSchema,
  quizSchema,
  assignmentSchema
]);

type FormValues = z.infer<typeof formSchema>;

interface LessonFormProps {
  initialData?: {
    title: string
    content?: string | null
    videoId?: string | null
    sectionId?: string | null
    duration?: number | null
    previewable?: boolean
    type?: 'video' | 'text' | 'quiz' | 'assignment'
    video?: {
      title: string | null
      source: string
    } | null
  } | null
  courseId: string
  lessonId?: string
  isEditing?: boolean
  workspaceId: string
}

export default function LessonForm({
  initialData,
  courseId,
  lessonId,
  isEditing = false,
  workspaceId
}: LessonFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [videoSelectOpen, setVideoSelectOpen] = useState(false)
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(initialData?.videoId || null)
  const [selectedVideo, setSelectedVideo] = useState<any>(initialData?.video || null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sections, setSections] = useState<any[]>([])
  const [sectionsLoading, setSectionsLoading] = useState(false)
  const [lessonType, setLessonType] = useState<'video' | 'text' | 'quiz' | 'assignment'>(
    initialData?.type || 'video'
  );
  
  // For quiz type
  const [questions, setQuestions] = useState<any[]>([]);
  
  // For assignment type
  const [rubric, setRubric] = useState<any[]>([]);
  const [fileTypes, setFileTypes] = useState<string[]>([]);
  
  // Fetch videos from the user's workspace
  const { data: videoData, isLoading: videoLoading } = useQuery({
    queryKey: ['workspace-videos', workspaceId],
    queryFn: () => getAllUserVideos(workspaceId),
    enabled: videoSelectOpen || lessonType === 'video'
  })
  
  // Fetch course sections
  useEffect(() => {
    const fetchSections = async () => {
      try {
        setSectionsLoading(true)
        console.log(`Fetching sections for course ID: ${courseId}`)
        const response = await axios.get(`/api/courses/${courseId}/sections`)
        console.log('Sections API response:', response.data)
        
        // Check if the response data has status and data properties (API format)
        if (response.data && response.data.status === 200 && Array.isArray(response.data.data)) {
          console.log('Using data from response.data.data, found sections:', response.data.data.length)
          setSections(response.data.data)
        } else if (Array.isArray(response.data)) {
          // Fallback for direct array response
          console.log('Using data directly from response.data, found sections:', response.data.length)
          setSections(response.data)
        } else {
          console.error('Unexpected sections data format:', response.data)
          setSections([])
        }
      } catch (error) {
        console.error('Failed to fetch sections:', error)
        toast.error('Failed to load course sections')
        setSections([])
      } finally {
        setSectionsLoading(false)
      }
    }
    
    fetchSections()
  }, [courseId])
  
  // Handle lesson type change with confirmation dialog
  const handleLessonTypeChange = (type: 'video' | 'text' | 'quiz' | 'assignment') => {
    if (isEditing) {
      // Show warning when changing lesson type during edit
      if (confirm("Changing the lesson type will reset all specific content. Are you sure?")) {
        setLessonType(type);
        form.setValue('type', type);
        // Reset type-specific fields
        if (type === 'video') {
          form.setValue('videoId', selectedVideoId);
        } else if (type === 'text') {
          form.setValue('content', '');
        } else if (type === 'quiz') {
          form.setValue('questions', []);
          setQuestions([]);
        } else if (type === 'assignment') {
          form.setValue('instructions', '');
          form.setValue('rubric', []);
          form.setValue('fileTypes', []);
          setRubric([]);
          setFileTypes([]);
        }
      }
    } else {
      setLessonType(type);
      form.setValue('type', type);
    }
  };
  
  // Get default values based on lesson type
  const getDefaultValues = () => {
    const base = {
      title: initialData?.title || '',
      content: initialData?.content || '',
      sectionId: initialData?.sectionId || '',
      duration: initialData?.duration || 0,
      previewable: initialData?.previewable || false,
      type: lessonType,
    };
    
    // Add type-specific defaults
    if (lessonType === 'video') {
      return {
        ...base,
        videoId: selectedVideoId || '',
      };
    } else if (lessonType === 'text') {
      return {
        ...base,
        content: initialData?.content || '',
      };
    } else if (lessonType === 'quiz') {
      return {
        ...base,
        questions: questions,
      };
    } else if (lessonType === 'assignment') {
      return {
        ...base,
        instructions: initialData?.content || '',
        rubric: rubric,
        fileTypes: fileTypes,
        maxFileSize: 10, // Default 10MB
        maxFiles: 1,
      };
    }
    
    return base;
  };
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });
  
  // Update form when lesson type changes
  useEffect(() => {
    form.reset(getDefaultValues());
  }, [lessonType]);
  
  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true)
      
      // Show a loading toast
      const loadingToast = toast.loading(
        isEditing ? 'Updating lesson...' : 'Creating lesson...'
      );
      
      // Prepare the submission data based on lesson type
      let submissionData: any = {
        ...values,
        // If sectionId is "none" or empty string, set it to undefined to avoid invalid foreign key issues
        sectionId: (values.sectionId === "none" || values.sectionId?.trim() === '') ? undefined : values.sectionId,
        // If duration is 0, set it to undefined
        duration: values.duration === 0 ? undefined : values.duration,
      };
      
      if (values.type === 'video') {
        submissionData.videoId = selectedVideoId;
      } else if (values.type === 'quiz') {
        submissionData.questions = questions;
      } else if (values.type === 'assignment') {
        submissionData.rubric = rubric;
      }
      
      if (isEditing && lessonId) {
        // Update existing lesson
        const response = await axios.patch(`/api/courses/${courseId}/lessons/${lessonId}`, submissionData)
        
        if (response.data.status === 200) {
          toast.dismiss(loadingToast);
          toast.success('Lesson updated successfully')
          router.push(`/courses/${courseId}`)
          router.refresh()
        } else {
          toast.dismiss(loadingToast);
          toast.error('Failed to update lesson')
        }
      } else {
        // Create new lesson
        const response = await axios.post(`/api/courses/${courseId}/lessons`, submissionData)
        
        if (response.data.status === 201) {
          toast.dismiss(loadingToast);
          toast.success('Lesson created successfully')
          router.push(`/courses/${courseId}`)
          router.refresh()
        } else {
          toast.dismiss(loadingToast);
          toast.error('Failed to create lesson')
        }
      }
    } catch (error) {
      toast.error(isEditing ? 'Failed to update lesson' : 'Failed to create lesson')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleVideoSelect = (video: any) => {
    setSelectedVideoId(video.id)
    setSelectedVideo(video)
    form.setValue('videoId', video.id);
    setVideoSelectOpen(false)
  }
  
  const handleRemoveVideo = () => {
    setSelectedVideoId(null)
    setSelectedVideo(null)
    form.setValue('videoId', undefined);
  }
  
  const filteredVideos = videoData?.status === 200 && videoData?.data ? 
    videoData.data.filter((video: any) => 
      video.title?.toLowerCase().includes(searchQuery.toLowerCase())
    ) : []
  
  // Get lesson type icon
  const getLessonTypeIcon = () => {
    switch (lessonType) {
      case 'video': return Film;
      case 'text': return FileText;
      case 'quiz': return FileQuestion;
      case 'assignment': return ClipboardEdit;
      default: return Film;
    }
  };
  
  // Updates questions when the quiz builder changes them
  const handleQuestionsChange = (newQuestions: any[]) => {
    setQuestions(newQuestions);
    form.setValue('questions', newQuestions);
  };
  
  // Updates rubric when the assignment builder changes it
  const handleRubricChange = (newRubric: any[]) => {
    setRubric(newRubric);
    form.setValue('rubric', newRubric);
  };
  
  // Updates file types when the assignment builder changes them
  const handleFileTypesChange = (newFileTypes: string[]) => {
    setFileTypes(newFileTypes);
    form.setValue('fileTypes', newFileTypes);
  };
  
  // Fix the video-related parts to work correctly with the UI
  const videoFieldKey = 'videoId' as keyof FormValues;
  const questionsFieldKey = 'questions' as keyof FormValues;
  const rubricFieldKey = 'rubric' as keyof FormValues;
  
  // Format video duration from seconds to MM:SS format
  const formatVideoDuration = (seconds: number) => {
    if (!seconds) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-card rounded-lg p-6">
          {/* Lesson Type Selector */}
          <div className="space-y-4">
            <Label className="text-foreground text-lg font-medium">Lesson Type</Label>
            <LessonTypeSelector
              value={lessonType}
              onChange={handleLessonTypeChange}
              disabled={isLoading}
            />
          </div>
          
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Lesson Title</FormLabel>
                <FormControl>
                  <Input
                    variant="outlined"
                    {...field}
                    placeholder="e.g. Introduction to the Topic"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  This will be the main title of your lesson.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Section Selection */}
          <FormField
            control={form.control}
            name="sectionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Section (Optional)</FormLabel>
                <FormControl>
                  <Select
                    disabled={isLoading}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full border border-input bg-background text-foreground">
                      <SelectValue placeholder="Select a section" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                      <SelectItem value="none">None (Add to main course)</SelectItem>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>{section.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>
                  Choose a section to organize your lessons.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Video Selection for video type */}
          {lessonType === 'video' && (
            <div className="space-y-4">
              {selectedVideo ? (
                <Card className="border border-border bg-background/50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center">
                          <Film className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{selectedVideo.title || 'Untitled Video'}</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedVideo.duration ? formatVideoDuration(selectedVideo.duration) : '00:00'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleRemoveVideo}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVideoSelectOpen(true)}
                  disabled={isLoading}
                  className="w-full py-8 border-dashed border-2 border-border bg-background hover:bg-background/90"
                >
                  <Film className="h-5 w-5 mr-2 text-primary" />
                  Select Video
                </Button>
              )}
              
              {form.formState.errors[videoFieldKey] && (
                <p className="text-destructive text-sm">{form.formState.errors[videoFieldKey].message}</p>
              )}
            </div>
          )}
          
          {/* Previewable Toggle */}
          <FormField
            control={form.control}
            name="previewable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-background">
                <div className="space-y-0.5">
                  <FormLabel className="text-foreground">Available in Preview</FormLabel>
                  <FormDescription>
                    Make this lesson available to users who haven't enrolled yet.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          {/* Duration field for all lesson types */}
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Duration (minutes)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      variant="outlined"
                      {...field}
                      type="number"
                      min="0"
                      placeholder="Estimated time to complete"
                      disabled={isLoading}
                      className="pl-10"
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  The estimated time it takes to complete this lesson.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Video-specific content */}
          {lessonType === 'video' && (
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      variant="outlined"
                      {...field}
                      placeholder="Add notes or resources to accompany the video"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide additional context, references, or resources for this video.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {/* Text-specific content */}
          {lessonType === 'text' && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Lesson Content</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value || ''}
                        onChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Create rich text content with formatting, images, and more.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          
          {/* Quiz-specific content */}
          {lessonType === 'quiz' && (
            <div className="space-y-4">
              <FormLabel className="text-foreground">Quiz Questions</FormLabel>
              <QuizBuilder
                questions={questions}
                onChange={handleQuestionsChange}
                disabled={isLoading}
              />
              
              {form.formState.errors[questionsFieldKey] && (
                <p className="text-destructive text-sm">{form.formState.errors[questionsFieldKey].message}</p>
              )}
            </div>
          )}
          
          {/* Assignment-specific content */}
          {lessonType === 'assignment' && (
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Assignment Instructions</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value || ''}
                        onChange={field.onChange}
                        disabled={isLoading}
                        placeholder="Provide detailed instructions for the assignment..."
                      />
                    </FormControl>
                    <FormDescription>
                      Clear instructions help students understand the assignment requirements.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormLabel className="text-foreground">Rubric</FormLabel>
              <AssignmentBuilder
                rubric={rubric}
                fileTypes={fileTypes}
                onRubricChange={handleRubricChange}
                onFileTypesChange={handleFileTypesChange}
                disabled={isLoading}
              />
              
              {form.formState.errors[rubricFieldKey] && (
                <p className="text-destructive text-sm">{form.formState.errors[rubricFieldKey].message}</p>
              )}
            </div>
          )}
          
          <div className="flex justify-between pt-6 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="relative group overflow-hidden"
            >
              <span className={cn(
                "inline-block transition-transform duration-200",
                isLoading ? "opacity-0" : "group-hover:-translate-y-full"
              )}>
                {isEditing ? 'Update Lesson' : 'Create Lesson'}
              </span>
              
              <span className={cn(
                "absolute inset-0 flex items-center justify-center transition-transform duration-200",
                isLoading ? "translate-y-0" : "translate-y-full group-hover:translate-y-0"
              )}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditing ? 'Update Lesson' : 'Create Lesson'
                )}
              </span>
            </Button>
          </div>
        </form>
      </Form>
      
      {/* Video Selection Dialog */}
      <Dialog open={videoSelectOpen} onOpenChange={setVideoSelectOpen}>
        <DialogContent className="bg-background border-border text-foreground max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select Video</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                variant="outlined"
                placeholder="Search videos..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {videoLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No videos found.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-1">
                {filteredVideos.map((video: any) => (
                  <div
                    key={video.id}
                    onClick={() => handleVideoSelect(video)}
                    className="cursor-pointer overflow-hidden rounded-md border border-border bg-card transition-all hover:bg-secondary/20"
                  >
                    <div className="aspect-video bg-background relative">
                      <video
                        src={video.source}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="truncate font-medium">{video.title || 'Untitled Video'}</h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 