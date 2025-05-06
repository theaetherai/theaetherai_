'use client';

import { useState, useRef, useEffect } from 'react';
import { Video, Subtitles, TextSelect, ExternalLink, Clock, Volume2, VolumeX, FileQuestion, Loader2, ChevronLeft, MessageSquare, Bot, ListChecks, BookOpen, Brain, Send, RotateCcw, ChevronRight, Home, Layers } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Separator } from '../../../components/ui/separator';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import { Badge } from '../../../components/ui/badge';
import { cn } from '../../../lib/utils';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { Textarea } from '../../../components/ui/textarea';
import Link from 'next/link';
import LessonNavigation from './LessonNavigation';

interface VideoLessonViewProps {
  videoId: string;
  lessonId: string;
  transcript?: string;
  captions?: any;
  userId?: string;
  isPreview?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  savedProgress?: number;
  courseTitle?: string;
  sectionTitle?: string;
  lessonTitle?: string;
  nextLessonId?: string;
  prevLessonId?: string;
}

export default function VideoLessonView({
  videoId,
  lessonId,
  transcript: initialTranscript,
  captions,
  userId,
  isPreview = false,
  onProgress,
  onComplete,
  savedProgress = 0,
  courseTitle = '',
  sectionTitle = '',
  lessonTitle = '',
  nextLessonId,
  prevLessonId
}: VideoLessonViewProps) {
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('video');
  const [progress, setProgress] = useState(savedProgress);
  const [autoPlayNext, setAutoPlayNext] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [isCompleted, setIsCompleted] = useState(progress >= 100);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | undefined>(initialTranscript);
  
  // AI Quiz generation states
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null);
  
  // AI question answering states
  const [question, setQuestion] = useState('');
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  
  // AI summary generation states
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  
  // Video commenting states
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [videoTabs, setVideoTabs] = useState('video');
  
  // AI tutor chat states
  const [showAiTutorChat, setShowAiTutorChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  
  // State to track if transcript is available (for TypeScript safety)
  const [hasTranscript, setHasTranscript] = useState(false);
  
  // Add these state variables near the top with other state declarations
  const [takingQuiz, setTakingQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [reviewingQuiz, setReviewingQuiz] = useState(false);
  
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressUpdateInterval = useRef<any>(null);
  const progressSyncTimeout = useRef<any>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadRetries, setLoadRetries] = useState(0);
  const [videoLoadFailed, setVideoLoadFailed] = useState(false);
  const MAX_RETRIES = 3;
  
  const [courseStructure, setCourseStructure] = useState<any>(null);
  
  // Function to retry video loading
  const retryVideoLoad = () => {
    if (videoRef.current) {
      setVideoLoadFailed(false);
      setLoadRetries(prev => prev + 1);
      setLoading(true);
      setError(null);
      
      // Force reload the video element
      const currentSrc = videoRef.current.src;
      videoRef.current.src = '';
      
      // Short timeout to ensure DOM updates
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.src = currentSrc;
          videoRef.current.load();
        }
      }, 200);
    }
  };
  
  // Fetch video data and course context
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch lesson data to get courseId
        const lessonResponse = await axios.get(`/api/courses/lessons/${lessonId}`);
        if (lessonResponse.data.status === 200) {
          setCourseId(lessonResponse.data.data.courseId);
          
          // Fetch course structure for navigation context
          try {
            const courseStructureResponse = await axios.get(`/api/courses/${lessonResponse.data.data.courseId}`);
            if (courseStructureResponse.data.status === 200) {
              setCourseStructure(courseStructureResponse.data.data);
            }
          } catch (structureError) {
            console.error("Error fetching course structure:", structureError);
          }
        }
        
        // Fetch video data with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout
        
        try {
          // Fetch video data
          const videoResponse = await axios.get(`/api/videos/${videoId}`, {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (videoResponse.data.status === 200) {
            const videoData = videoResponse.data.data;
            setVideo(videoData);
            
            // Check if summery (transcript) exists
            setHasTranscript(Boolean(videoData.summery && videoData.summery.trim().length > 0));
            
            // If no transcript is provided directly to component but exists in video data, use it
            if (!initialTranscript && videoData.summery) {
              setTranscript(videoData.summery);
            }
          } else {
            setError('Failed to load video: ' + (videoResponse.data.error || 'Unknown error'));
            setVideoLoadFailed(true);
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            setError('Video request timed out. Please check your connection and try again.');
          } else if (fetchError.response) {
            setError(`Failed to load video: ${fetchError.response.status} ${fetchError.response.statusText}`);
          } else if (fetchError.request) {
            setError('Network error. Please check your connection and try again.');
          } else {
            setError('Failed to load video: ' + fetchError.message);
          }
          setVideoLoadFailed(true);
        }
      } catch (err: any) {
        let errorMessage = 'Failed to load video';
        if (err.response) {
          errorMessage += `: ${err.response.status} ${err.response.statusText}`;
        } else if (err.request) {
          errorMessage += ': Network error';
        } else {
          errorMessage += `: ${err.message}`;
        }
        setError(errorMessage);
        setVideoLoadFailed(true);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [videoId, lessonId, initialTranscript]);
  
  // Start tracking progress when the component loads
  useEffect(() => {
    if (savedProgress > 0 && videoRef.current) {
      // Find position to resume from
      const resumeTime = (savedProgress / 100) * videoRef.current.duration;
      videoRef.current.currentTime = resumeTime;
      setCurrentTime(resumeTime);
    }
    
    return () => {
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current);
      }
      if (progressSyncTimeout.current) {
        clearTimeout(progressSyncTimeout.current);
      }
    };
  }, [savedProgress]);
  
  // Set up event listeners when the video element is ready
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
      
      // Calculate progress percentage
      const progressPercent = Math.round((videoElement.currentTime / videoElement.duration) * 100);
      setProgress(progressPercent);
      
      // Report progress
      onProgress?.(progressPercent);
      
      // Schedule progress sync with server
      if (progressSyncTimeout.current) {
        clearTimeout(progressSyncTimeout.current);
      }
      
      progressSyncTimeout.current = setTimeout(() => {
        syncProgress(progressPercent);
      }, 3000);
      
      // Mark as completed if reached 95% or more
      if (progressPercent >= 95 && !isCompleted) {
        setIsCompleted(true);
        onComplete?.();
      }
    };
    
    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
      setLoading(false);
      setLoadingProgress(100);
      
      // If there's saved progress, seek to that position
      if (savedProgress > 0) {
        const resumeTime = (savedProgress / 100) * videoElement.duration;
        videoElement.currentTime = resumeTime;
        setCurrentTime(resumeTime);
      }
    };
    
    const handleLoadedData = () => {
      setLoading(false);
      setVideoLoadFailed(false);
    };
    
    const handleProgress = () => {
      if (videoElement.buffered.length > 0) {
        const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
        const duration = videoElement.duration;
        const progress = Math.round((bufferedEnd / duration) * 100);
        setLoadingProgress(progress);
      }
    };
    
    const handleError = (e: ErrorEvent) => {
      console.error('Video loading error:', e);
      setVideoLoadFailed(true);
      setLoading(false);
      setError('Video failed to load. Please try again.');
      
      // Auto-retry if under max retries
      if (loadRetries < MAX_RETRIES) {
        setTimeout(() => {
          retryVideoLoad();
        }, 3000); // Wait 3 seconds before retry
      }
    };
    
    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    const handleVolumeChange = () => {
      setVolume(videoElement.volume);
      setMuted(videoElement.muted);
    };
    
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('loadeddata', handleLoadedData);
    videoElement.addEventListener('progress', handleProgress);
    videoElement.addEventListener('error', handleError as EventListener);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('volumechange', handleVolumeChange);
    
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('loadeddata', handleLoadedData);
      videoElement.removeEventListener('progress', handleProgress);
      videoElement.removeEventListener('error', handleError as EventListener);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [savedProgress, onProgress, onComplete, isCompleted, loadRetries]);
  
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
  
  // Format time from seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Play/pause video
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };
  
  // Seek in video
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !videoContainerRef.current) return;
    
    const rect = videoContainerRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * videoRef.current.duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
  };
  
  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const value = parseFloat(e.target.value);
    videoRef.current.volume = value;
    setVolume(value);
    
    if (value === 0) {
      videoRef.current.muted = true;
    } else if (videoRef.current.muted) {
      videoRef.current.muted = false;
    }
  };
  
  // Generate AI quiz based on video content
  const generateQuiz = async () => {
    console.log('Quiz generation started');
    
    // Use video.summery as fallback for transcript
    const transcriptContent = transcript || (video && video.summery);
    
    console.log('Transcript availability check:', {
      hasDirectTranscript: Boolean(transcript),
      hasVideoSummery: Boolean(video && video.summery),
      transcriptLength: transcriptContent ? transcriptContent.length : 0
    });
    
    if (!video || !transcriptContent) {
      console.error('Quiz generation failed: Missing video or transcript');
      toast.error("Video or transcript is not available for quiz generation");
      return;
    }
    
    setGeneratingQuiz(true);
    
    try {
      // Process and clean the transcript
      let processedTranscript = transcriptContent
        .replace(/(\r\n|\r|\n)+/g, ' ') // Replace newlines with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim(); // Trim whitespace from beginning and end
      
      // Check if the transcript is valid - reducing threshold to 20 characters
      if (processedTranscript.length < 20) {
        console.error('Transcript too short:', processedTranscript.length);
        toast.error("The transcript is too short to generate a meaningful quiz");
        setGeneratingQuiz(false);
        return;
      }
      
      // Take only a portion of the transcript if it's very long to avoid token limits
      const trimmedTranscript = processedTranscript.length > 8000 
        ? processedTranscript.substring(0, 8000) + "... (transcript truncated)"
        : processedTranscript;
      
      // Construct prompt for AI
      const prompt = `
        Create a quiz based on this video content. 
        
        VIDEO TITLE: ${video.title || 'Educational Video'}
        VIDEO TRANSCRIPT: ${trimmedTranscript}
        
        Please generate a quiz with 5 questions based on the video content above.
        Each question should be either multiple choice or true/false.
        For multiple choice questions, provide 4 options with only one correct answer.
        For true/false questions, clearly mark which option is correct.
        
        YOUR RESPONSE MUST BE VALID JSON with the following structure:
        [
          {
            "id": "q1",
            "text": "Question text here?",
            "type": "multipleChoice",
            "options": [
              {"id": "q1-a", "text": "Option A", "isCorrect": false},
              {"id": "q1-b", "text": "Option B", "isCorrect": true},
              {"id": "q1-c", "text": "Option C", "isCorrect": false},
              {"id": "q1-d", "text": "Option D", "isCorrect": false}
            ]
          }
        ]
        
        DO NOT include any explanatory text. ONLY include the JSON array with the quiz questions.
      `;
      
      console.log('Making API request to generate quiz');
      
      try {
        // Call the AI tutor API with explicit context for quiz generation
        const response = await axios.post('/api/ai/tutor', {
          prompt,
          context: 'generate_quiz',
          instructions: `Generate a multiple-choice quiz for video titled: ${video.title}`
        }, {
          // Add a timeout to prevent long-hanging requests
          timeout: 30000,
          // Add headers to help with debugging
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Info': 'VideoLessonView'
          }
        });
        
        console.log('API response received:', { 
          status: response.status,
          hasQuizField: Boolean(response.data.quiz),
          hasTextField: Boolean(response.data.text),
          dataKeys: Object.keys(response.data)
        });
        
        // Check for the response format
        if (response.data.quiz) {
          console.log('Quiz data was returned directly in quiz field');
          
          if (Array.isArray(response.data.quiz) && response.data.quiz.length > 0) {
            setGeneratedQuiz(response.data.quiz);
            toast.success("Quiz generated successfully!");
          } else {
            console.error('Invalid quiz data structure in quiz field:', response.data.quiz);
            toast.error("Failed to generate quiz: Invalid data format");
            // Fall back to basic quiz generation
            fallbackQuizGeneration(trimmedTranscript);
          }
        } else if (response.data.text) {
          // Try to parse from the text field as fallback
          console.log('Attempting to parse quiz from text field');
          try {
            // Log the text content to see what we're working with
            console.log('Text content (first 200 chars):', response.data.text.substring(0, 200));
            
            // Handle both cases - direct JSON or JSON embedded in text
            let textToProcess = response.data.text;
            
            // First clean up potential markdown formatting
            if (textToProcess.includes('```json')) {
              const jsonMatch = textToProcess.match(/```json\s*([\s\S]*?)\s*```/);
              if (jsonMatch && jsonMatch[1]) {
                console.log('Found JSON in markdown code block');
                textToProcess = jsonMatch[1];
              }
            } else if (textToProcess.includes('```')) {
              const jsonMatch = textToProcess.match(/```\s*([\s\S]*?)\s*```/);
              if (jsonMatch && jsonMatch[1]) {
                console.log('Found code block in text');
                textToProcess = jsonMatch[1];
              }
            }
            
            // Look for JSON-like patterns in the text (starting with [ and ending with ])
            const jsonMatch = textToProcess.match(/\[\s*{[\s\S]*}\s*\]/);
            if (jsonMatch) {
              console.log('Found JSON-like content in the text');
              textToProcess = jsonMatch[0];
            }
            
            // Additional cleanup to fix common JSON issues
            textToProcess = textToProcess
              .replace(/(\w+):/g, '"$1":') // Add quotes to JSON keys
              .replace(/,\s*}/g, '}') // Remove trailing commas in objects
              .replace(/,\s*\]/g, ']') // Remove trailing commas in arrays
              .replace(/'/g, '"') // Replace single quotes with double quotes
              .replace(/\\"/g, '\\"'); // Properly escape double quotes
              
            // Try multiple parsing approaches
            let quizData;
            try {
              quizData = JSON.parse(textToProcess);
              console.log('Successfully parsed quiz data with standard JSON.parse');
            } catch (initialParseError) {
              console.error("Standard parsing failed:", initialParseError);
              
              // Try extracting JSON array with regex
              const arrayMatch = textToProcess.match(/\[[\s\S]*\]/);
              if (arrayMatch) {
                try {
                  quizData = JSON.parse(arrayMatch[0]);
                  console.log('Successfully parsed quiz data with regex extraction');
                } catch (arrayParseError) {
                  console.error("Array extraction parsing failed:", arrayParseError);
                  throw new Error("All JSON parsing approaches failed");
                }
              } else {
                throw new Error("Could not find JSON array in response");
              }
            }
            
            // Validate the quiz data structure
            if (Array.isArray(quizData) && quizData.length > 0) {
              console.log(`Parsed ${quizData.length} quiz questions`);
              
              // Add IDs if they're missing
              const processedQuizData = quizData.map((question: any, index: number) => {
                if (!question.id) {
                  question.id = `q${index + 1}`;
                }
                
                // Process options if they exist
                if (Array.isArray(question.options)) {
                  question.options = question.options.map((option: any, optIndex: number) => {
                    if (!option.id) {
                      option.id = `q${index + 1}-${String.fromCharCode(97 + optIndex)}`;
                    }
                    return option;
                  });
                }
                
                return question;
              });
              
              setGeneratedQuiz(processedQuizData);
              toast.success("Quiz generated successfully!");
            } else {
              console.error('Invalid quiz data structure:', quizData);
              toast.error("Failed to generate quiz: Invalid quiz data structure");
              // Fall back to basic quiz generation
              fallbackQuizGeneration(trimmedTranscript);
            }
          } catch (parseError) {
            console.error("Error parsing quiz data:", parseError);
            console.error("Raw text received:", response.data.text);
            toast.error("Failed to generate quiz: Could not parse the AI response into quiz questions");
            // Fall back to basic quiz generation
            fallbackQuizGeneration(trimmedTranscript);
          }
        } else {
          console.error('No quiz or text field in response:', response.data);
          toast.error("Failed to generate quiz: API returned an unexpected response format");
          // Fall back to basic quiz generation
          fallbackQuizGeneration(trimmedTranscript);
        }
      } catch (apiError: any) {
        console.error("API request failed:", apiError);
        console.error("API error details:", {
          message: apiError.message,
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          responseData: apiError.response?.data
        });
        
        // Enhanced error reporting to help track down the specific issue
        let errorMessage = "Server error";
        if (apiError.response) {
          // Server responded with an error status code
          if (apiError.response.status === 401) {
            errorMessage = "Authentication error. Please log in again.";
          } else if (apiError.response.status === 500) {
            errorMessage = "Internal server error. This might be due to the AI service being temporarily unavailable.";
            // Log additional info to help debug
            console.error("500 error details:", {
              responseHeaders: apiError.response.headers,
              requestData: {
                promptLength: prompt.length,
                context: 'generate_quiz',
                hasTitle: Boolean(video.title)
              }
            });
          } else if (apiError.response.status === 400) {
            errorMessage = apiError.response.data?.error || "Bad request. The transcript format might be invalid.";
          } else if (apiError.response.status === 429) {
            errorMessage = "Too many requests. Please try again later.";
          } else {
            errorMessage = `Server error: ${apiError.response.status} ${apiError.response.statusText}`;
          }
        } else if (apiError.request) {
          // Request was made but no response received
          if (apiError.code === 'ECONNABORTED') {
            errorMessage = "Request timed out. The server might be busy.";
          } else {
            errorMessage = "No response from server. Network issues or server is down.";
          }
        } else {
          // Error in setting up the request
          errorMessage = `Request setup error: ${apiError.message}`;
        }
        
        toast.error(errorMessage);
        console.log("Falling back to simplified quiz generation...");
        
        // Fall back to basic quiz generation
        fallbackQuizGeneration(trimmedTranscript);
      }
    } catch (outerError: any) {
      console.error("Outer error in quiz generation:", outerError);
      toast.error(`Failed to generate quiz: ${outerError.message || 'Unknown error'}`);
      setGeneratingQuiz(false);
    }
  };
  
  // Fallback quiz generation method that doesn't require server API
  const fallbackQuizGeneration = (transcriptContent: string) => {
    console.log("Using fallback quiz generation method");
    
    try {
      // Handle very short transcripts
      if (transcriptContent.length < 100) {
        console.log("Using basic fallback for very short transcript:", transcriptContent);
        
        // Create basic questions based on the video title
        const basicQuestions = [];
        
        // Question 1: About video title
        basicQuestions.push({
          id: "q1",
          text: `This video is about ${video.title || 'an educational topic'}?`,
          type: "multipleChoice",
          points: 1,
          options: [
            { id: "q1-a", text: "True", isCorrect: true },
            { id: "q1-b", text: "False", isCorrect: false },
            { id: "q1-c", text: "Not mentioned", isCorrect: false },
            { id: "q1-d", text: "Partially true", isCorrect: false }
          ]
        });
        
        // Question 2: General knowledge
        basicQuestions.push({
          id: "q2",
          text: `The information presented in this video is important for understanding ${video.title || 'this topic'}?`,
          type: "multipleChoice",
          points: 1,
          options: [
            { id: "q2-a", text: "True", isCorrect: true },
            { id: "q2-b", text: "False", isCorrect: false },
            { id: "q2-c", text: "Not enough information", isCorrect: false },
            { id: "q2-d", text: "Depends on the context", isCorrect: false }
          ]
        });
        
        // Use any words in the transcript for a third question
        const words = transcriptContent.split(/\s+/).filter(w => w.length > 3);
        if (words.length > 0) {
          const selectedWord = words[Math.floor(Math.random() * words.length)];
          basicQuestions.push({
            id: "q3",
            text: `The video mentions the term "${selectedWord}"?`,
            type: "multipleChoice",
            points: 1,
            options: [
              { id: "q3-a", text: "True", isCorrect: true },
              { id: "q3-b", text: "False", isCorrect: false },
              { id: "q3-c", text: "Not clearly stated", isCorrect: false },
              { id: "q3-d", text: "Multiple times", isCorrect: false }
            ]
          });
        }
        
        setGeneratedQuiz(basicQuestions);
        toast.success("Basic quiz generated. Limited by short transcript.");
        setGeneratingQuiz(false);
        return;
      }
      
      // For longer transcripts, use the original approach
      // Extract key sentences from transcript
      const sentences = transcriptContent
        .split(/[.!?]/) // Split by sentence endings
        .map(s => s.trim())
        .filter(s => s.length > 30 && s.length < 150); // Filter for reasonable length sentences
      
      if (sentences.length < 5) {
        console.log("Limited sentence content. Using simplified questions.");
        
        // Get all sentences that are at least somewhat usable
        const usableSentences = transcriptContent
          .split(/[.!?]/)
          .map(s => s.trim())
          .filter(s => s.length > 10);
        
        // If we have at least some usable content
        if (usableSentences.length > 0) {
          const quizQuestions = usableSentences.slice(0, 5).map((sentence, index) => {
            return {
              id: `q${index + 1}`,
              text: `Is the following statement from the video correct? "${sentence}"`,
              type: "multipleChoice",
              points: 1,
              options: [
                { id: `q${index + 1}-a`, text: "True", isCorrect: true },
                { id: `q${index + 1}-b`, text: "False", isCorrect: false },
                { id: `q${index + 1}-c`, text: "Partially correct", isCorrect: false },
                { id: `q${index + 1}-d`, text: "Not mentioned this way", isCorrect: false }
              ]
            };
          });
          
          setGeneratedQuiz(quizQuestions);
          toast.success("Quiz generated using simplified method");
          setGeneratingQuiz(false);
          return;
        }
        
        console.error("Not enough content for fallback quiz generation");
        toast.error("Could not generate a quiz: Insufficient content");
        setGeneratingQuiz(false);
        return;
      }
      
      // Original implementation for normal-length transcripts
      // Shuffle sentences and take 5 for questions
      const shuffled = [...sentences].sort(() => 0.5 - Math.random());
      const selectedSentences = shuffled.slice(0, 5);
      
      // Create basic quiz questions
      const quizQuestions = selectedSentences.map((sentence, index) => {
        // Create a question from the sentence by removing a key word
        const words = sentence.split(' ');
        const longWords = words.filter(w => w.length > 5);
        
        let questionText = sentence;
        let correctAnswer = "True";
        
        // If we have long words, create a fill-in-the-blank question
        if (longWords.length > 0) {
          const wordToReplace = longWords[Math.floor(Math.random() * longWords.length)];
          questionText = sentence.replace(wordToReplace, "_______");
          correctAnswer = wordToReplace;
        }
        
        // Create a basic question
        const question = {
          id: `q${index + 1}`,
          text: `Based on the video, is the following statement correct? "${questionText}"`,
          type: "multipleChoice",
          options: [
            { id: `q${index + 1}-a`, text: "True", isCorrect: true },
            { id: `q${index + 1}-b`, text: "False", isCorrect: false },
            { id: `q${index + 1}-c`, text: "Not mentioned in the video", isCorrect: false },
            { id: `q${index + 1}-d`, text: "It depends on the context", isCorrect: false }
          ]
        };
        
        return question;
      });
      
      console.log("Generated fallback quiz:", quizQuestions);
      setGeneratedQuiz(quizQuestions);
      toast.success("Quiz generated using fallback method");
    } catch (fallbackError) {
      console.error("Fallback quiz generation failed:", fallbackError);
      toast.error("All quiz generation methods failed");
    } finally {
      setGeneratingQuiz(false);
    }
  };
  
  // Create quiz lesson from generated quiz
  const createQuizLesson = async () => {
    console.log('Creating quiz lesson from generated quiz');
    console.log('Quiz creation parameters:', {
      hasQuiz: Boolean(generatedQuiz),
      quizLength: generatedQuiz?.length,
      hasUserId: Boolean(userId),
      isPreview: isPreview
    });
    
    if (!generatedQuiz || generatedQuiz.length === 0) {
      console.error('Cannot create quiz lesson: No quiz data available');
      toast.error("Cannot create quiz: No quiz questions generated");
      return;
    }
    
    if (isPreview) {
      console.error('Cannot create quiz lesson: In preview mode');
      toast.error("Quiz creation is not available in preview mode");
      return;
    }
    
    if (!userId) {
      console.error('Cannot create quiz lesson: No user ID');
      toast.error("Please sign in to create quizzes");
      return;
    }
    
    try {
      console.log('Getting current lesson data');
      // Get current course and section ID
      const lessonResponse = await axios.get(`/api/courses/lessons/${lessonId}`);
      if (lessonResponse.data.status !== 200) {
        console.error('Failed to get current lesson data:', lessonResponse.data);
        toast.error("Failed to get current lesson data");
        return;
      }
      
      const { courseId, sectionId } = lessonResponse.data.data;
      console.log('Lesson data retrieved:', { courseId, sectionId });
      
      // Create new quiz lesson
      const quizData = {
        title: `Quiz: ${video.title || 'Video Content'}`,
        type: 'quiz', // Explicitly set the type to quiz
        sectionId,
        questions: JSON.stringify(generatedQuiz),
        passingScore: 70,
        timeLimit: 10, // 10 minutes to complete the quiz
        previewable: false
      };
      
      console.log('Creating new quiz lesson with data:', quizData);
      
      const response = await axios.post(`/api/courses/${courseId}/lessons`, quizData);
      
      console.log('Quiz lesson creation response:', {
        status: response.status,
        data: response.data
      });
      
      if (response.data.status === 201) {
        toast.success("Quiz lesson created successfully!");
        setShowQuizDialog(false);
        
        // Redirect to the new quiz lesson
        const newLessonId = response.data.data.id;
        window.location.href = `/courses/${courseId}/lessons/${newLessonId}`;
      } else {
        console.error('Failed to create quiz lesson:', response.data);
        toast.error("Failed to create quiz lesson: " + (response.data.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error("Error creating quiz lesson:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
      toast.error(`Failed to create quiz lesson: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Navigate back to course page
  const navigateToCourse = () => {
    if (courseId) {
      router.push(`/courses/${courseId}`);
    }
  };
  
  // Fetch comments for this video/lesson
  useEffect(() => {
    if (userId && !isPreview) {
      fetchComments();
    }
  }, [userId, videoId, lessonId, isPreview]);
  
  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/courses/lessons/${lessonId}/comments`);
      if (response.data.status === 200) {
        setComments(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };
  
  // Submit a comment on the video
  const submitComment = async () => {
    if (!comment.trim() || !userId || isPreview) return;
    
    setSubmittingComment(true);
    try {
      const response = await axios.post(`/api/courses/lessons/${lessonId}/comments`, {
        content: comment,
        timestamp: Math.round(currentTime)
      });
      
      if (response.data.status === 201) {
        toast.success("Comment added successfully");
        setComment('');
        await fetchComments();
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };
  
  // Function to sanitize AI responses by removing 'think' tags
  const sanitizeAIResponse = (text: string) => {
    if (!text) return '';
    // Remove content within <think> tags, including the tags themselves
    return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  };
  
  // Ask AI a question about the video content
  const askQuestion = async () => {
    // Use video.summery as fallback for transcript
    const transcriptContent = transcript || (video && video.summery);
    
    if (!question.trim() || !transcriptContent) {
      toast.error("Please enter a question and ensure video has transcript");
      return;
    }
    
    setAskingQuestion(true);
    setAnswer(null);
    
    try {
      const prompt = `
        VIDEO TITLE: ${video.title || 'Educational Video'}
        VIDEO TRANSCRIPT: ${transcriptContent.substring(0, 4000)}
        
        USER QUESTION: ${question}
        
        Please answer in FIRST PERSON, as if you're the student's personal tutor. Use "I", "me", "my" throughout.
        For example: "I'll explain this concept...", "Let me address your question...", "In my view..."
        
        Be conversational and friendly, but accurate. If the transcript doesn't contain enough information,
        acknowledge that limitation but still provide your best answer as their tutor.
        
        DO NOT include any of your thinking process or meta-commentary in <think> tags or similar.
      `;
      
      const response = await axios.post('/api/ai/tutor', {
        prompt,
        context: 'answer_question',
        instructions: `Answer the question in FIRST PERSON as a personal tutor for video: ${video.title}`
      });
      
      if (response.data.text) {
        // Sanitize the response to remove think tags
        setAnswer(sanitizeAIResponse(response.data.text));
        toast.success("Question answered");
      } else {
        toast.error("Failed to answer question");
      }
    } catch (error) {
      console.error("Error asking question:", error);
      toast.error("Failed to process question");
    } finally {
      setAskingQuestion(false);
    }
  };
  
  // Generate an AI summary of the video content
  const generateSummary = async () => {
    // Use video.summery as fallback for transcript
    const transcriptContent = transcript || (video && video.summery);
    
    if (!transcriptContent) {
      toast.error("Video transcript is not available for summary generation");
      return;
    }
    
    // Check if transcript is very short
    if (transcriptContent.length < 50) {
      toast.warning("Transcript is very short. Summary may be limited.");
    }
    
    setGeneratingSummary(true);
    setSummary(null);
    
    try {
      const prompt = `
        VIDEO TITLE: ${video.title || 'Educational Video'}
        VIDEO TRANSCRIPT: ${transcriptContent.substring(0, 4000)}
        
        Create a structured educational summary of this video content that helps students understand the key points.
        
        Format as specified:
        1. Brief overview section (2-3 sentences) in first person
        2. Clear sections with headings (bold format with **)
        3. Bullet points for key items
        4. Short conclusion in first person
        
        IMPORTANT: Write your entire response in FIRST PERSON, as if you're directly talking to the student.
        Use phrases like "I want to highlight...", "Let me explain...", "I've identified these key concepts..."
        
        Keep it concise but comprehensive - focus on the most important concepts and definitions.
        
        DO NOT include any of your thinking process or meta-commentary in <think> tags or similar.
      `;
      
      console.log('Making API request to generate summary');
      
      const response = await axios.post('/api/ai/tutor', {
        prompt,
        context: 'generate_summary',
        instructions: `Create structured educational summary in FIRST PERSON for: ${video.title}`
      });
      
      console.log('Summary API response received:', { 
        status: response.status,
        hasTextField: Boolean(response.data.text),
        dataKeys: Object.keys(response.data)
      });
      
      if (response.data.text) {
        // Sanitize the summary to remove think tags
        setSummary(sanitizeAIResponse(response.data.text));
        toast.success("Summary generated");
      } else {
        console.error('No summary text in response:', response.data);
        toast.error("Failed to generate summary: No text in response");
      }
    } catch (error: any) {
      console.error("Error generating summary:", error);
      toast.error("Failed to generate summary: " + (error.message || "Unknown error"));
    } finally {
      setGeneratingSummary(false);
    }
  };
  
  // Initialize AI tutor chat
  useEffect(() => {
    if (showAiTutorChat && chatMessages.length === 0 && video) {
      // Add welcome message
      setChatMessages([{
        id: Date.now().toString(),
        content: `Hi there! I'm your personal AI tutor for this video. I'll help you understand "${video.title || 'this content'}" - just ask me anything about what you've watched and I'll explain it!`,
        role: 'assistant',
        timestamp: new Date()
      }]);
    }
  }, [showAiTutorChat, video, chatMessages.length]);
  
  // Ask AI a question directly in the chat
  const sendChatMessage = async () => {
    // Use video.summery as fallback for transcript
    const transcriptContent = transcript || (video && video.summery);
    
    if (!chatInput.trim() || !transcriptContent) return;
    
    const userMessage = {
      id: Date.now().toString(),
      content: chatInput,
      role: 'user',
      timestamp: new Date()
    };
    
    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    setChatInput('');
    setSendingChat(true);
    
    try {
      const prompt = `
        VIDEO TITLE: ${video.title || 'Educational Video'}
        VIDEO TRANSCRIPT: ${transcriptContent.substring(0, 4000)}
        
        USER QUESTION: ${chatInput}
        
        Please respond as a friendly, helpful tutor. Use a conversational tone as if you're chatting with 
        a student. Be clear and engaging in your explanation.
        
        If the transcript doesn't contain the answer, politely acknowledge this and provide the best 
        guidance you can based on what's available. Avoid formal academic language or overly technical 
        explanations unless specifically asked.
        
        DO NOT include any of your thinking process or meta-commentary in <think> tags or similar.
      `;
      
      const response = await axios.post('/api/ai/tutor', {
        prompt,
        context: 'answer_question',
        instructions: `Answer the question in FIRST PERSON as a personal tutor for video: ${video.title}`
      });
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        content: sanitizeAIResponse(response.data.text || "I'm sorry, I couldn't process that question."),
        role: 'assistant',
        timestamp: new Date()
      };
      
      setChatMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error("Error in chat:", error);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error processing your question. Please try again.",
        role: 'assistant',
        timestamp: new Date()
      };
      
      setChatMessages([...newMessages, errorMessage]);
    } finally {
      setSendingChat(false);
    }
  };
  
  // Navigate to full AI Tutor page
  const navigateToAiTutor = () => {
    if (videoId) {
      router.push(`/ai-tutor?videoId=${videoId}`);
    }
  };
  
  // Add this function for handling answers
  const handleQuizAnswer = (questionId: string, optionId: string) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };
  
  // Add this function for calculating scores
  const calculateQuizScore = () => {
    if (!generatedQuiz) return 0;
    
    const totalQuestions = generatedQuiz.length;
    let correctAnswers = 0;
    
    generatedQuiz.forEach((question: any) => {
      const selectedOptionId = quizAnswers[question.id];
      if (selectedOptionId) {
        const selectedOption = question.options.find((option: any) => option.id === selectedOptionId);
        if (selectedOption?.isCorrect) {
          correctAnswers++;
        }
      }
    });
    
    return Math.round((correctAnswers / totalQuestions) * 100);
  };
  
  // Add this function for quiz submission
  const submitQuiz = () => {
    const score = calculateQuizScore();
    setQuizScore(score);
    setReviewingQuiz(true);
  };
  
  // Add this function to reset the quiz
  const resetQuiz = () => {
    setTakingQuiz(false);
    setQuizAnswers({});
    setQuizScore(null);
    setReviewingQuiz(false);
  };
  
  // Navigate to next or previous lesson
  const navigateToLesson = (targetLessonId: string | undefined) => {
    if (targetLessonId && courseId) {
      router.push(`/courses/${courseId}/lessons/${targetLessonId}`);
    }
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="mt-4 text-muted-foreground">Loading video...</p>
      </div>
    );
  }
  
  if (error || !video) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
        <div className="w-20 h-20 flex items-center justify-center rounded-full bg-red-500/10 mb-4">
          <Video className="h-10 w-10 text-red-500" />
        </div>
        <h3 className="text-xl font-medium text-foreground mb-2">Video Not Available</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          {error || "This video could not be loaded. It may have been removed or there was an error processing it."}
        </p>
        
        <div className="flex gap-3">
          {courseId && (
            <Button 
              variant="outline" 
              onClick={() => router.push(`/courses/${courseId}`)}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to course
            </Button>
          )}
          
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg>
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Navigation using shared component */}
      <LessonNavigation 
        courseId={courseId || undefined}
        courseTitle={courseTitle || courseStructure?.title}
        sectionTitle={sectionTitle}
        lessonTitle={lessonTitle || video?.title}
        prevLessonId={prevLessonId}
        nextLessonId={nextLessonId}
      />
      
      {/* Main content - Grid layout with video and AI tools side by side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Video player column - takes 2/3 of the space on desktop */}
        <div className="md:col-span-2">
          <div className="bg-card rounded-lg border border-border overflow-hidden elevation-3 elevation-transition">
            <Tabs value={videoTabs} onValueChange={setVideoTabs} className="w-full">
              <div className="border-b border-border bg-card p-2">
                <TabsList className="bg-muted">
                  <TabsTrigger value="video" className="data-[state=active]:bg-secondary">
                    <Video className="h-4 w-4 mr-2" />
                    Video
                  </TabsTrigger>
                  
                  <TabsTrigger value="transcript" className="data-[state=active]:bg-secondary">
                    <TextSelect className="h-4 w-4 mr-2" />
                    Transcript
                  </TabsTrigger>
                  
                  <TabsTrigger value="comments" className="data-[state=active]:bg-secondary">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Comments
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="video" className="m-0 p-0">
                <div className="relative bg-black">
                  {loading && !videoLoadFailed && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                      <div className="w-16 h-16 relative mb-4">
                        <svg className="w-full h-full animate-spin" viewBox="0 0 50 50">
                          <circle
                            className="stroke-muted-foreground/30"
                            cx="25"
                            cy="25"
                            r="20"
                            fill="none"
                            strokeWidth="4"
                          />
                          <circle
                            className="stroke-primary"
                            cx="25"
                            cy="25"
                            r="20"
                            fill="none"
                            strokeWidth="4"
                            strokeDasharray={`${loadingProgress * 1.25}, 125`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">{loadingProgress}%</span>
                        </div>
                      </div>
                      <p className="text-muted-foreground">Loading video...</p>
                    </div>
                  )}
                  
                  {videoLoadFailed && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                        <span className="text-2xl text-red-500">!</span>
                      </div>
                      <p className="text-white text-center mb-4 max-w-xs">{error || "Video failed to load"}</p>
                      <div className="flex gap-2">
                        <Button 
                          onClick={retryVideoLoad} 
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          Retry Video
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <video
                    ref={videoRef}
                    src={video?.source}
                    className="w-full max-h-[70vh] mx-auto"
                    playsInline
                    preload="auto"
                    onError={() => setVideoLoadFailed(true)}
                    onStalled={() => {
                      console.log("Video playback stalled");
                      // For cases where the video stalls but doesn't error
                      if (videoRef.current) {
                        // Try to recover by seeking slightly
                        const currentTime = videoRef.current.currentTime;
                        videoRef.current.currentTime = Math.max(0, currentTime - 1);
                        
                        // Try to play again after a short delay
                        setTimeout(() => {
                          if (videoRef.current && videoRef.current.paused) {
                            videoRef.current.play().catch(err => {
                              console.error("Failed to recover from stall:", err);
                            });
                          }
                        }, 1000);
                      }
                    }}
                    onWaiting={() => {
                      console.log("Video waiting for data");
                      // If waiting too long, we might need to adjust playback rate
                      if (videoRef.current && videoRef.current.readyState < 3) {
                        // Lower playback rate temporarily to allow buffering
                        const originalRate = videoRef.current.playbackRate;
                        videoRef.current.playbackRate = 0.5;
                        
                        // Restore playback rate after buffering
                        const checkBuffering = () => {
                          if (videoRef.current && videoRef.current.readyState >= 3) {
                            videoRef.current.playbackRate = originalRate;
                          } else {
                            setTimeout(checkBuffering, 1000);
                          }
                        };
                        
                        setTimeout(checkBuffering, 2000);
                      }
                    }}
                  />
                  
                  {/* Custom video controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-4">
                    <div className="space-y-2">
                      {/* Progress bar */}
                      <div
                        className="relative h-1.5 bg-muted/50 rounded-full cursor-pointer group"
                        onClick={handleSeek}
                        ref={videoContainerRef}
                      >
                        <div 
                          className="absolute h-full bg-primary rounded-full"
                          style={{ width: `${(currentTime / duration) * 100}%` }}
                        />
                        <div 
                          className="absolute h-3 w-3 bg-primary rounded-full -translate-y-1/4 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ left: `${(currentTime / duration) * 100}%`, transform: 'translateX(-50%)' }}
                        />
                      </div>
                      
                      {/* Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-foreground hover:bg-background/10"
                            onClick={togglePlay}
                          >
                            {playing ? (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                <rect x="6" y="4" width="4" height="16" />
                                <rect x="14" y="4" width="4" height="16" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
                            )}
                          </Button>
                          
                          <div className="flex items-center gap-1 min-w-[80px]">
                            <span className="text-xs text-foreground">
                              {formatTime(currentTime)}
                            </span>
                            <span className="text-xs text-muted-foreground">/</span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(duration)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-foreground hover:bg-background/10"
                              onClick={toggleMute}
                            >
                              {muted || volume === 0 ? (
                                <VolumeX className="h-4 w-4" />
                              ) : (
                                <Volume2 className="h-4 w-4" />
                              )}
                            </Button>
                            
                            <div className="w-20">
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={muted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-full accent-primary"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className={cn(
                              "h-8 w-8 text-foreground hover:bg-background/10",
                              showCaptions && "text-primary"
                            )}
                            onClick={() => setShowCaptions(!showCaptions)}
                            disabled={!captions}
                          >
                            <Subtitles className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="transcript" className="m-0 p-0 max-h-[400px] overflow-y-auto custom-scrollbar">
                <div className="p-6 bg-card text-foreground">
                  {(transcript || (video && video.summery)) ? (
                    <div className="prose prose-invert max-w-none prose-p:my-2">
                      {(transcript || (video && video.summery)).split('\n').map((paragraph: string, i: number) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                      
                      {(transcript || (video && video.summery)).length < 100 && (
                        <div className="bg-yellow-500/10 p-2 rounded mt-4 text-sm">
                          <p className="text-yellow-600">Note: This transcript is limited. A more detailed transcript would enable better AI features.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="mb-2">No transcript available for this video.</p>
                      <p className="text-sm">Without a transcript, AI-powered features like quiz generation and summaries will be limited.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="comments" className="m-0 p-0 max-h-[400px] overflow-y-auto custom-scrollbar">
                <div className="p-6 bg-card text-foreground">
                  {userId && !isPreview ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">Add a Comment</h3>
                        <div className="flex gap-2">
                          <Textarea 
                            placeholder="Share your thoughts or ask a question..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[80px]"
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button 
                            onClick={submitComment}
                            disabled={!comment.trim() || submittingComment}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            {submittingComment ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Submitting...
                              </>
                            ) : "Post Comment"}
                          </Button>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Discussion ({comments.length})</h3>
                        {comments.length > 0 ? (
                          <div className="space-y-4">
                            {comments.map((comment) => (
                              <div key={comment.id} className="bg-muted/30 p-4 rounded-lg border border-border">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                    {comment.user.firstname.charAt(0)}
                                    {comment.user.lastname.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {comment.user.firstname} {comment.user.lastname}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(comment.createdAt).toLocaleString()}
                                      {comment.timestamp && ` • ${formatTime(comment.timestamp)}`}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-sm">{comment.content}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            No comments yet. Be the first to start a discussion!
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Sign in to view and post comments.
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Video progress and info */}
          <div className="mt-4 flex items-center justify-between bg-card p-4 rounded-lg border border-border shadow-md">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{formatTime(duration)} total length</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Progress value={progress} className="w-32 h-2" />
                <span className="text-xs text-muted-foreground">{progress}% complete</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="auto-play" className="text-sm text-muted-foreground">Auto-play next</Label>
                <Switch
                  id="auto-play"
                  checked={autoPlayNext}
                  onCheckedChange={setAutoPlayNext}
                />
              </div>
              
              {isCompleted ? (
                    <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">
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
        
        {/* AI Tools column - takes 1/3 of the space on desktop */}
        <div className="space-y-4">
          <div className="bg-card rounded-lg border border-border overflow-hidden shadow-md">
            <div className="bg-muted/30 border-b border-border p-3">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Learning Tools
              </h3>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Question Generator Tool */}
              <div className="bg-card p-4 rounded-lg border border-border hover:shadow-md transition-all">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/10 p-2 rounded-full">
                      <Bot className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Ask Questions</h3>
                      <p className="text-xs text-muted-foreground">Get answers about video content</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setShowAiTutorChat(!showAiTutorChat)}
                      variant="default"
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                      disabled={!transcript}
                    >
                      Quick Chat
                    </Button>
                    
                    <Button 
                      onClick={navigateToAiTutor}
                      variant="outline"
                      className="flex-1"
                      disabled={!videoId}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      AI Tutor
                    </Button>
                  </div>
                  
                  {showAiTutorChat && (
                    <div className="mt-2 border border-border rounded-lg overflow-hidden">
                      <div className="max-h-[300px] overflow-y-auto p-3 bg-muted/10 space-y-3">
                        {chatMessages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-lg ${
                              msg.role === 'user' 
                                ? 'bg-blue-500/20 text-foreground' 
                                : 'bg-primary/10 text-foreground'
                            }`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          </div>
                        ))}
                        {sendingChat && (
                          <div className="flex justify-start">
                            <div className="max-w-[85%] p-3 rounded-lg bg-primary/10 flex items-center gap-2">
                              <div className="flex space-x-1">
                                <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                              </div>
                              <span className="text-xs">Thinking...</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-2 border-t border-border bg-background flex gap-2">
                        <Textarea 
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Ask about anything in the video..."
                          className="text-sm min-h-[60px] resize-none"
                          disabled={sendingChat}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (chatInput.trim() && !sendingChat) {
                                sendChatMessage();
                              }
                            }
                          }}
                        />
                        <Button 
                          onClick={sendChatMessage}
                          disabled={!chatInput.trim() || sendingChat}
                          className="bg-blue-500 hover:bg-blue-600 text-white self-end"
                          size="icon"
                          title="Send message (or press Enter)"
                        >
                          {sendingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {!showAiTutorChat && !answer && (
                    <div className="space-y-2">
                      <Textarea 
                        placeholder="Ask a question about the video content..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        className="min-h-[80px] text-sm"
                        disabled={!transcript || askingQuestion}
                      />
                      <Button 
                        onClick={askQuestion}
                        variant="default"
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                        disabled={!transcript || askingQuestion || !question.trim()}
                      >
                        {askingQuestion ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : "Ask Question"}
                      </Button>
                    </div>
                  )}
                  
                  {!showAiTutorChat && answer && (
                    <div className="space-y-3">
                      <div className="bg-blue-500/5 p-4 rounded-lg border border-blue-200/30">
                        <p className="text-sm text-foreground leading-relaxed">{answer}</p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAnswer(null);
                            setQuestion('');
                          }}
                        >
                          Ask Another
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Summary Generator Tool */}
              <div className="bg-card p-4 rounded-lg border border-border hover:shadow-md transition-all">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500/10 p-2 rounded-full">
                      <BookOpen className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Video Summary</h3>
                      <p className="text-xs text-muted-foreground">Your personal tutor's explanation of key points</p>
                    </div>
                  </div>
                  
                  {!summary ? (
                    <Button 
                      onClick={generateSummary}
                      variant="default"
                      className="w-full bg-green-500 hover:bg-green-600 text-white"
                      disabled={!(transcript || (video && video.summery)) || generatingSummary}
                    >
                      {generatingSummary ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : "Generate Summary"}
                    </Button>
                  ) : (
                    <div className="space-y-2 w-full">
                      <div className="bg-green-500/5 p-4 rounded-lg text-sm border border-green-200/30 max-h-[300px] overflow-y-auto">
                        <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-green-700 prose-headings:mt-3 prose-headings:mb-2 prose-p:mb-2 prose-p:text-foreground prose-li:my-0">
                          {summary}
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => setSummary(null)}
                        >
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quiz Generation Tool */}
              <div className="bg-card p-4 rounded-lg border border-border hover:shadow-md transition-all">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <FileQuestion className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Test Your Knowledge</h3>
                      <p className="text-xs text-muted-foreground">Generate a quiz based on this video content</p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      if (!userId && !isPreview) {
                        toast.error("Please sign in to generate quizzes");
                        return;
                      }
                      
                      setShowQuizDialog(true);
                      if (!generatedQuiz) {
                        generateQuiz();
                      }
                    }}
                    variant="default"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={
                      hasTranscript === false ||
                      (isCompleted === false && userId !== undefined && isPreview === false)
                    }
                  >
                    {!hasTranscript ? "No transcript available" :
                      (!isCompleted && userId && !isPreview) ? "Complete video to generate quiz" : 
                      isPreview ? "Take Practice Quiz" : "Generate Quiz"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quiz Generation Dialog */}
      <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI-Generated Quiz</DialogTitle>
            <DialogDescription>
              A quiz generated based on the video content. You can create this as a new lesson.
            </DialogDescription>
          </DialogHeader>
          
          {isPreview && !generatedQuiz && !generatingQuiz && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm">
              <div className="font-semibold mb-1">Preview Mode</div>
              <p>You can take practice quizzes in preview mode to test your knowledge.</p>
            </div>
          )}
          
          {generatingQuiz && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Generating quiz based on video content...</p>
              <p className="text-xs text-muted-foreground mt-2">This may take up to 30 seconds</p>
            </div>
          )}
          
          {!isPreview && generatedQuiz && !generatingQuiz && (
            <div className="space-y-4 my-4">
              <div className="bg-muted p-4 rounded-lg border border-border">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-foreground">Quiz Preview</h3>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600">
                    {generatedQuiz.length} Questions
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  This quiz will test understanding of the key concepts covered in this video.
                </p>
                
                <div className="space-y-4">
                  {generatedQuiz.slice(0, 3).map((question: any, index: number) => (
                    <div key={question.id || index} className="bg-card p-3 rounded-lg border border-border">
                      <div className="flex gap-2 items-start">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground mb-2">
                            {question.text}
                          </p>
                          <div className="grid grid-cols-1 gap-2 pl-1">
                            {question.options?.map((option: any, optIndex: number) => (
                              <div 
                                key={option.id || optIndex} 
                                className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-muted"
                              >
                                <div className="h-3 w-3 rounded-full flex items-center justify-center border border-muted-foreground/30">
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {option.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {generatedQuiz.length > 3 && (
                  <div className="bg-muted/50 rounded-lg border border-border p-3 mt-3 text-center">
                    <p className="text-sm text-muted-foreground">
                      + {generatedQuiz.length - 3} more questions will be included in the quiz
                    </p>
                  </div>
                )}
              </div>
              
              <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-600 mb-2 flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  AI-Generated Content
                </h4>
                <p className="text-xs text-muted-foreground">
                  This quiz was automatically generated based on the video transcript.
                  Review the questions before creating the quiz lesson to ensure they
                  accurately reflect the video content.
                </p>
              </div>
            </div>
          )}
          
          {!generatingQuiz && !generatedQuiz && (
            <div className="py-4 text-center space-y-4">
              <div className="bg-red-500/10 p-4 rounded-lg border border-red-200">
                <p className="text-red-600 font-medium mb-2">Failed to generate quiz</p>
                <p className="text-sm text-muted-foreground mb-3">
                  The AI was unable to generate a proper quiz based on this video content. This could be due to:
                </p>
                <ul className="text-sm text-muted-foreground list-disc pl-6 mb-4 space-y-1">
                  <li>Insufficient transcript content to generate meaningful questions</li>
                  <li>Technical issue with the AI service</li>
                  <li>Problems parsing the AI response into quiz format</li>
                </ul>
                <Button 
                  onClick={generateQuiz}
                  variant="outline"
                  className="w-full"
                >
                  Retry Quiz Generation
                </Button>
              </div>
            </div>
          )}
          
          {isPreview && !takingQuiz && !reviewingQuiz && generatedQuiz && (
            <div className="flex flex-col items-center p-4 bg-primary/5 rounded-lg border border-primary/20 mb-4">
              <h3 className="text-lg font-medium mb-2">Take this quiz to test your knowledge</h3>
              <p className="text-sm text-center mb-4">
                You've generated a {generatedQuiz.length}-question quiz based on this video.
              </p>
              <Button
                onClick={() => setTakingQuiz(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Start Quiz
              </Button>
            </div>
          )}
          
          {isPreview && takingQuiz && !reviewingQuiz && generatedQuiz && (
            <div className="space-y-6 my-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Answer all questions</h3>
                <Badge variant="outline">
                  {Object.keys(quizAnswers).length} of {generatedQuiz.length} answered
                </Badge>
              </div>
              
              {generatedQuiz.map((question: any, index: number) => (
                <div key={question.id} className="bg-card p-4 rounded-lg border border-border">
                  <div className="flex gap-2 items-start mb-3">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {question.text}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pl-8">
                    {question.options.map((option: any) => (
                      <div 
                        key={option.id}
                        onClick={() => handleQuizAnswer(question.id, option.id)}
                        className={`
                          flex items-center gap-2 p-2 rounded-md cursor-pointer
                          ${quizAnswers[question.id] === option.id 
                            ? 'bg-primary/20 border border-primary/30' 
                            : 'hover:bg-muted border border-transparent'}
                        `}
                      >
                        <div className={`
                          h-4 w-4 rounded-full flex items-center justify-center 
                          ${quizAnswers[question.id] === option.id 
                            ? 'bg-primary border-primary' 
                            : 'border border-muted-foreground/30'}
                        `}>
                          {quizAnswers[question.id] === option.id && (
                            <div className="h-2 w-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <span className="text-sm">
                          {option.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    resetQuiz();
                    setTakingQuiz(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitQuiz}
                  disabled={Object.keys(quizAnswers).length < generatedQuiz.length}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {Object.keys(quizAnswers).length < generatedQuiz.length ? 
                    `Answer all ${generatedQuiz.length} questions` : 
                    "Submit Quiz"}
                </Button>
              </div>
            </div>
          )}
          
          {isPreview && reviewingQuiz && generatedQuiz && (
            <div className="space-y-6 my-4">
              <div className="flex flex-col items-center p-6 bg-card rounded-lg border border-border">
                <h3 className="text-xl font-semibold mb-2">Quiz Results</h3>
                <div className="w-24 h-24 rounded-full border-4 border-primary flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold">{quizScore || 0}%</span>
                </div>
                <p className="text-sm text-center mb-4">
                  {(quizScore || 0) >= 70 
                    ? "Great job! You've passed the quiz." 
                    : "Keep learning! Review the material and try again."}
                </p>
                
                <div className="w-full flex flex-col gap-2">
                  <h4 className="text-sm font-medium">Review Your Answers:</h4>
                  {generatedQuiz.map((question: any, index: number) => {
                    const selectedOption = question.options.find(
                      (opt: any) => opt.id === quizAnswers[question.id]
                    );
                    const correctOption = question.options.find(
                      (opt: any) => opt.isCorrect
                    );
                    const isCorrect = selectedOption?.isCorrect;
                    
                    return (
                      <div key={question.id} className="text-sm border border-border rounded-md p-2">
                        <div className="flex items-start gap-2">
                          <div className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-xs
                            ${isCorrect 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'}
                          `}>
                            {isCorrect ? '✓' : '✗'}
                          </div>
                          <div>
                            <p className="font-medium">{index + 1}. {question.text}</p>
                            <p className="text-xs mt-1">
                              Your answer: {selectedOption?.text || "Not answered"}
                            </p>
                            {!isCorrect && (
                              <p className="text-xs text-green-600 mt-1">
                                Correct answer: {correctOption?.text}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetQuiz();
                      setTakingQuiz(false);
                    }}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={resetQuiz}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                // Reset quiz state when closing
                if (takingQuiz || reviewingQuiz) {
                  resetQuiz();
                }
                setShowQuizDialog(false);
              }}
            >
              Close
            </Button>
            
            {/* Button to retry if quiz generation failed */}
            {!generatingQuiz && !generatedQuiz && (
              <Button
                onClick={generateQuiz}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Retry Generation
              </Button>
            )}
            
            {/* Create Quiz Lesson button (non-preview mode) */}
            {!generatingQuiz && generatedQuiz && !isPreview && (
              <Button
                onClick={createQuizLesson}
                disabled={generatingQuiz}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Create Quiz Lesson
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 