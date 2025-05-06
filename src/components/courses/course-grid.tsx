'use client'

import { CourseProps } from '@/types/index.type'
import CourseCard from './course-card'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Search, ChevronRight, ChevronLeft, BookOpen } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ExtendedCourse {
  id: string
  title: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  userId: string | null
  User: {
    firstname: string | null
    lastname: string | null
    image: string | null
  } | null
  _count?: {
    lessons: number
    enrollments: number
  }
  isEnrolled?: boolean
  isOwner?: boolean
  currentUserId?: string
  thumbnailUrl?: string
  rating?: number
  bestseller?: boolean
  price?: number
  discountPrice?: number
  category?: string
  level?: string
}

interface CourseGridProps {
  courses: ExtendedCourse[]
  title?: string
  showFilters?: boolean
  onSearch?: (search: string) => void
  onSort?: (sort: string) => void
  isLoading?: boolean
  showCarousel?: boolean
}

// Simple star rating component
const StarRating = ({ rating = 0, size = 16 }: { rating: number, size?: number }) => {
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          fill={i < Math.round(rating || 0) ? "#e59819" : "none"}
          stroke={i < Math.round(rating || 0) ? "#e59819" : "#6a6f73"}
          className={`h-${size/4} w-${size/4}`}
        />
      ))}
    </div>
  )
}

// Function to check if a URL is valid
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

export default function CourseGrid({
  courses,
  title = 'Courses',
  showFilters = false,
  onSearch,
  onSort,
  isLoading = false,
  showCarousel = false
}: CourseGridProps) {
  const [search, setSearch] = useState('')
  const [startIndex, setStartIndex] = useState(0)
  const router = useRouter()
  
  // Add state to track image errors for each course
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  
  // For carousel functionality
  const itemsPerPage = 5 // Number of items to show at once
  const endIndex = startIndex + itemsPerPage
  const displayedCourses = showCarousel 
    ? courses.slice(startIndex, endIndex) 
    : courses
  
  const canGoBack = startIndex > 0
  const canGoForward = endIndex < courses.length
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    onSearch?.(e.target.value)
  }
  
  const handleSort = (value: string) => {
    onSort?.(value)
  }
  
  const handleNext = () => {
    if (canGoForward) {
      setStartIndex(startIndex + itemsPerPage)
    }
  }
  
  const handlePrev = () => {
    if (canGoBack) {
      setStartIndex(Math.max(0, startIndex - itemsPerPage))
    }
  }

  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  }
  
  // Handler for image loading errors
  const handleImageError = (courseId: string) => {
    setImageErrors(prev => ({
      ...prev,
      [courseId]: true
    }))
  }
  
  // Render the course thumbnail image
  const renderCourseThumbnail = (course: ExtendedCourse) => {
    if (course.thumbnailUrl && !imageErrors[course.id]) {
      if (isValidUrl(course.thumbnailUrl)) {
        // Try to use Next.js Image for valid URLs
        return (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover"
            onError={() => handleImageError(course.id)}
          />
        );
      } else {
        // Fallback to standard img tag for URLs that might not be in the allowed domains
        return (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => handleImageError(course.id)}
          />
        );
      }
    } else {
      // Default fallback when no image or error
      return (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-secondary/30 flex items-center justify-center">
          <BookOpen className="h-12 w-12 text-white opacity-80" />
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {showCarousel && courses.length > itemsPerPage && (
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, courses.length)} of {courses.length} courses
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {showCarousel && courses.length > itemsPerPage && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full"
                disabled={!canGoBack}
                onClick={handlePrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full"
                disabled={!canGoForward}
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {showFilters && (
            <div className="flex gap-4">
              <div className="relative w-[250px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={search}
                  onChange={handleSearch}
                  className="pl-10"
                />
              </div>
              
              <Select onValueChange={handleSort} defaultValue="newest">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="h-[280px] bg-card rounded-md animate-pulse"
            />
          ))}
        </div>
      ) : courses.length > 0 ? (
        <div className="relative">
          <div className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-6 pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {displayedCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all min-w-[320px] max-w-[320px] border border-[#eee] snap-start flex flex-col cursor-pointer"
                style={{ boxShadow: '0 2px 8px rgba(28,29,31,0.12)' }}
                onClick={() => handleCourseClick(course.id)}
              >
                <div className="relative w-full h-[180px] rounded-t-xl overflow-hidden">
                  {renderCourseThumbnail(course)}
                  {course.bestseller && (
                    <div className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded">
                      Bestseller
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-foreground text-lg mb-1 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    {course.User?.firstname} {course.User?.lastname}
                  </p>
                  {course.rating ? (
                    <div className="flex items-center mb-1">
                      <span className="font-bold text-amber-600 mr-1">{course.rating.toFixed(1)}</span>
                      <StarRating rating={course.rating} size={14} />
                      <span className="text-xs text-muted-foreground ml-1">
                        ({course._count?.enrollments || 0})
                      </span>
                    </div>
                  ) : null}
                  <div className="mb-2">
                    {course.discountPrice ? (
                      <div className="flex items-center">
                        <span className="font-bold text-foreground text-lg">GHS {(course.discountPrice || 0).toFixed(2)}</span>
                        <span className="text-muted-foreground line-through ml-2 text-base">GHS {(course.price || 0).toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="font-bold text-foreground text-lg">GHS {(course.price || 0).toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {course.level && (
                      <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs">
                        {course.level}
                      </span>
                    )}
                    {course.category && (
                      <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs">
                        {course.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-muted-foreground bg-card rounded-md">
          <p className="text-lg">No courses found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      )}
      
      {showCarousel && courses.length > itemsPerPage && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: Math.ceil(courses.length / itemsPerPage) }).map((_, index) => {
            const isActive = index * itemsPerPage === startIndex
            return (
              <button
                key={index}
                className={`w-2 h-2 rounded-full ${isActive ? 'bg-primary' : 'bg-muted'}`}
                onClick={() => setStartIndex(index * itemsPerPage)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
} 