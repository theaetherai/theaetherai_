export interface User {
  id: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  image: string | null;
}

export interface Video {
  id: string;
  title: string | null;
  source: string;
  duration?: number | null;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  price?: number | null;
  discountPrice?: number | null;
  thumbnailUrl?: string | null;
  category?: string | null;
  level?: string | null;
  bestseller?: boolean;
  featured?: boolean;
  popular?: boolean;
  published?: boolean;
  requirements?: string[];
  objectives?: string[];
  targetAudience?: string | null;
  totalDuration?: number | null;
  userId?: string | null;
  user?: User | null;
  createdAt: Date;
  updatedAt: Date;
  sections?: Section[];
  _count?: {
    lessons: number;
    enrollments: number;
  }
}

export interface Section {
  id: string;
  title: string;
  description: string | null;
  order: number;
  courseId?: string | null;
  lessons?: Lesson[];
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation: string;
}

export type LessonType = 'video' | 'text' | 'quiz' | 'assignment';

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  type: LessonType;
  order: number;
  duration?: number | null;
  previewable: boolean;
  videoId?: string | null;
  sectionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  section?: Section | null;
  video?: Video | null;
  course?: Course | null;
  courseId?: string | null;
  
  // Quiz specific fields
  questions?: QuizQuestion[] | string | null;
  passingScore?: number | null;
  timeLimit?: number | null;
  
  // Assignment specific fields
  rubric?: any[] | string | null;
  dueDate?: Date | string | null;
  fileTypes?: string[] | null;
  maxFileSize?: number | null;
  maxFiles?: number | null;
}

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  progress: number;
  completed: boolean;
  lastAccessed: Date;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  completed: boolean;
  completedAt?: Date | null;
  createdAt: Date;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  lessonId: string;
  answers: any;
  score: number;
  passed: boolean;
  timeSpent?: number | null;
  createdAt: Date;
}

export interface AssignmentSubmission {
  id: string;
  userId: string;
  lessonId: string;
  content?: string | null;
  fileUrls?: any | null;
  status: string;
  submittedAt: Date;
  grade?: number | null;
  feedback?: string | null;
  gradedAt?: Date | null;
} 