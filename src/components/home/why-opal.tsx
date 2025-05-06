'use client'

import { ReactNode } from 'react'

interface WhyOpalProps {
  className?: string
}

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center text-center p-6">
      <div className="w-16 h-16 rounded-full bg-[#f7f9fa] flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-[#1c1d1f] mb-2">{title}</h3>
      <p className="text-[#6a6f73]">{description}</p>
    </div>
  )
}

export function WhyOpal({ className }: WhyOpalProps) {
  return (
    <section className={`py-16 bg-white ${className}`}>
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1c1d1f] tracking-tight mb-4">
            Why Learn with Aether.ai?
          </h2>
          <p className="text-lg text-[#6a6f73] max-w-3xl">
            Aether.ai combines the power of AI with expert instructors to create a unique learning experience
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-[#a435f0]">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            }
            title="Learn at Your Own Pace"
            description="Access courses anytime, anywhere, and learn at your own pace with lifetime access."
          />
          
          <FeatureCard
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-[#a435f0]">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
              </svg>
            }
            title="AI-Enhanced Learning"
            description="Our AI tools analyze your progress and adapt content to help you learn more effectively."
          />
          
          <FeatureCard
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-[#a435f0]">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            }
            title="Expert Instructors"
            description="Learn from industry experts who have crafted courses with real-world applications."
          />
        </div>
      </div>
    </section>
  )
} 