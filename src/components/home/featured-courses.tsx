'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Course {
  id: string
  title: string
  instructor: string
  rating: number
  reviewCount: number
  price: number
  discountPrice?: number
  imageSrc: string
  category: string
  level: string
  bestseller?: boolean
}

interface FeaturedCoursesProps {
  title: string
  subtitle?: string
  courses: Course[]
  className?: string
}

export function FeaturedCourses({ title, subtitle, courses, className }: FeaturedCoursesProps) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showLeftButton, setShowLeftButton] = useState(false)
  const [showRightButton, setShowRightButton] = useState(true)

  // Function to handle scrolling left
  const scrollLeft = () => {
    if (containerRef.current) {
      const newPosition = Math.max(0, scrollPosition - 800)
      containerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' })
      setScrollPosition(newPosition)
    }
  }

  // Function to handle scrolling right
  const scrollRight = () => {
    if (containerRef.current) {
      const newPosition = Math.min(
        containerRef.current.scrollWidth - containerRef.current.clientWidth,
        scrollPosition + 800
      )
      containerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' })
      setScrollPosition(newPosition)
    }
  }

  // Update button visibility based on scroll position
  useEffect(() => {
    const updateButtonVisibility = () => {
      if (!containerRef.current) return
      
      setShowLeftButton(scrollPosition > 0)
      setShowRightButton(
        scrollPosition < 
        containerRef.current.scrollWidth - containerRef.current.clientWidth - 10
      )
    }
    
    updateButtonVisibility()
    
    // Add event listener for resize
    window.addEventListener('resize', updateButtonVisibility)
    
    return () => {
      window.removeEventListener('resize', updateButtonVisibility)
    }
  }, [scrollPosition])

  // Handle scroll event to update the position state
  const handleScroll = () => {
    if (containerRef.current) {
      setScrollPosition(containerRef.current.scrollLeft)
    }
  }

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => {
        container.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  return (
    <div className={cn("py-12 bg-white", className)}>
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-start mb-8">
          <h2 className="text-3xl font-bold text-[#1c1d1f] tracking-tight mb-2">{title}</h2>
          {subtitle && <p className="text-lg text-[#6a6f73]">{subtitle}</p>}
        </div>
        <div className="relative">
          {showLeftButton && (
            <Button
              onClick={scrollLeft}
              className="absolute left-[-24px] top-1/2 z-20 -translate-y-1/2 shadow-lg bg-white text-[#1c1d1f] border border-[#d1d7dc] rounded-full h-12 w-12 p-0 hover:scale-110 transition-transform"
              style={{ boxShadow: '0 2px 8px rgba(28,29,31,0.12)' }}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          <div
            ref={containerRef}
            className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-6 pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all min-w-[320px] max-w-[320px] border border-[#eee] snap-start flex flex-col cursor-default"
                style={{ boxShadow: '0 2px 8px rgba(28,29,31,0.12)' }}
              >
                <div className="relative w-full h-[180px] rounded-t-xl overflow-hidden">
                  <Image
                    src={course.imageSrc}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                  {course.bestseller && (
                    <div className="absolute top-2 left-2 bg-[#eceb98] text-[#3d3c0a] text-xs font-bold px-2 py-1 rounded">
                      Bestseller
                    </div>
                  )}
                </div>
                <CardContent className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-[#1c1d1f] text-lg mb-1 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-[#6a6f73] mb-1">{course.instructor}</p>
                  <div className="flex items-center mb-1">
                    <span className="font-bold text-[#b4690e] mr-1">{course.rating.toFixed(1)}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          fill={i < Math.round(course.rating) ? "#e59819" : "none"}
                          stroke={i < Math.round(course.rating) ? "#e59819" : "#6a6f73"}
                          className="h-4 w-4"
                        />
                      ))}
                    </div>
                    <span className="text-xs text-[#6a6f73] ml-1">({course.reviewCount})</span>
                  </div>
                  <div className="flex items-center mt-2">
                    {course.discountPrice ? (
                      <>
                        <span className="font-bold text-[#1c1d1f] text-lg">${course.discountPrice.toFixed(2)}</span>
                        <span className="text-[#6a6f73] line-through ml-2 text-base">${course.price.toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="font-bold text-[#1c1d1f] text-lg">${course.price.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex items-center mt-3 gap-2 text-xs">
                    <span className="bg-[#f7f9fa] text-[#6a6f73] px-2 py-1 rounded-full">
                      {course.level}
                    </span>
                    <span className="bg-[#f7f9fa] text-[#6a6f73] px-2 py-1 rounded-full">
                      {course.category}
                    </span>
                  </div>
                </CardContent>
              </div>
            ))}
          </div>
          {showRightButton && (
            <Button
              onClick={scrollRight}
              className="absolute right-[-24px] top-1/2 z-20 -translate-y-1/2 shadow-lg bg-white text-[#1c1d1f] border border-[#d1d7dc] rounded-full h-12 w-12 p-0 hover:scale-110 transition-transform"
              style={{ boxShadow: '0 2px 8px rgba(28,29,31,0.12)' }}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 