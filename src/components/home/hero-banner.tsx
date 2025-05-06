'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface HeroBannerProps {
  className?: string
}

export function HeroBanner({ className }: HeroBannerProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // Rotate through content every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroContent.length)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Use the hero images we created
  const heroImages = [
    '/hero-student.svg',
    '/images/online-learning.svg'
  ]
  
  // Different content to rotate through
  const heroContent = [
    {
      title: "Skills that drive you forward",
      description: "Technology and the world of work change fast — with us, you're faster. Get the skills to achieve goals and stay competitive."
    },
    {
      title: "Learn at your own pace",
      description: "Study anytime, anywhere with our flexible online learning platform designed to fit your busy schedule."
    },
    {
      title: "Expert-led instruction",
      description: "Learn from industry professionals with real-world experience in their fields for practical, career-ready skills."
    }
  ]
  
  return (
    <div className={`relative bg-[#1c1d1f] text-white ${className}`}>
      {/* Hero background image */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <div className="relative w-full h-full bg-gradient-to-r from-primary/30 to-secondary/20">
          <div className="absolute inset-0">
            <Image
              src={heroImages[currentImageIndex % heroImages.length]}
              alt="Online learning"
              fill
              className="object-contain opacity-30 mix-blend-overlay"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#1c1d1f] via-transparent to-transparent opacity-80" />
        </div>
      </div>
      
      {/* Hero content */}
      <div className="relative container mx-auto px-4 md:px-6 py-24 flex flex-col md:flex-row items-center min-h-[500px] gap-10">
        {/* Left: Text and CTAs */}
        <div className="flex-1 max-w-xl z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight animate-fade-in">
            {heroContent[currentImageIndex % heroContent.length].title}
          </h1>
          <p className="text-lg md:text-xl mb-8 text-gray-200 animate-fade-in">
            {heroContent[currentImageIndex % heroContent.length].description}
          </p>
          <div className="flex gap-4 mb-6">
            <Link href="/courses">
              <Button className="bg-primary text-white font-bold px-6 py-3 text-lg rounded-md shadow hover:bg-primary/90">
                Explore Courses
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button variant="outline" className="border-white text-white font-bold px-6 py-3 text-lg rounded-md shadow hover:bg-white hover:text-[#1c1d1f]">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
        {/* Right: Feature image */}
        <div className="flex-1 flex justify-center z-10">
          <div className="rounded-lg overflow-hidden shadow-2xl max-w-md w-full bg-black/30 backdrop-blur-sm border border-white/10">
            <Image
              src={heroImages[(currentImageIndex + 1) % heroImages.length]}
              alt="Student learning online"
              width={500}
              height={400}
              className="object-contain w-full h-full"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  )
} 