import { HeroBanner } from '@/components/home/hero-banner'
import { FeaturedCourses } from '@/components/home/featured-courses'
import { WhyOpal } from '@/components/home/why-opal'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Mock data for development - replace with actual API calls in production
const featuredCourses = [
  {
    id: '1',
    title: 'Complete Web Development Bootcamp with AI Tools',
    instructor: 'Jessica Johnson',
    rating: 4.8,
    reviewCount: 1234,
    price: 89.99,
    discountPrice: 19.99,
    imageSrc: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?q=80&w=640',
    category: 'Development',
    level: 'Beginner',
    bestseller: true
  },
  {
    id: '2',
    title: 'Machine Learning and AI: The Complete Guide',
    instructor: 'Michael Chen',
    rating: 4.6,
    reviewCount: 843,
    price: 119.99,
    discountPrice: 24.99,
    imageSrc: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?q=80&w=640',
    category: 'IT & Software',
    level: 'Intermediate'
  },
  {
    id: '3',
    title: 'Business Leadership: Managing Teams Effectively',
    instructor: 'Sarah Williams',
    rating: 4.7,
    reviewCount: 567,
    price: 69.99,
    discountPrice: 16.99,
    imageSrc: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=640',
    category: 'Business',
    level: 'All Levels',
    bestseller: true
  },
  {
    id: '4',
    title: 'Digital Marketing Masterclass: SEO, Social Media, and More',
    instructor: 'David Lopez',
    rating: 4.5,
    reviewCount: 921,
    price: 94.99,
    discountPrice: 21.99,
    imageSrc: 'https://images.unsplash.com/photo-1571844307880-751c6d86f3f3?q=80&w=640',
    category: 'Marketing',
    level: 'Beginner'
  },
  {
    id: '5',
    title: 'Python Programming: From Basics to Advanced',
    instructor: 'Alex Turner',
    rating: 4.9,
    reviewCount: 1876,
    price: 99.99,
    discountPrice: 22.99,
    imageSrc: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=640',
    category: 'Development',
    level: 'All Levels',
    bestseller: true
  },
  {
    id: '6',
    title: 'UI/UX Design: Creating User-Centered Experiences',
    instructor: 'Emma Roberts',
    rating: 4.7,
    reviewCount: 742,
    price: 84.99,
    discountPrice: 19.99,
    imageSrc: 'https://images.unsplash.com/photo-1541462608143-67571c6738dd?q=80&w=640',
    category: 'Design',
    level: 'Intermediate'
  }
]

const popularCourses = [
  {
    id: '7',
    title: 'Data Science and Analytics with Python',
    instructor: 'Robert Martinez',
    rating: 4.7,
    reviewCount: 1102,
    price: 129.99,
    discountPrice: 24.99,
    imageSrc: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=640',
    category: 'IT & Software',
    level: 'Intermediate'
  },
  {
    id: '8',
    title: 'Personal Productivity Masterclass',
    instructor: 'Lisa Johnson',
    rating: 4.8,
    reviewCount: 952,
    price: 59.99,
    discountPrice: 14.99,
    imageSrc: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=640',
    category: 'Personal Development',
    level: 'All Levels',
    bestseller: true
  },
  {
    id: '9',
    title: 'Financial Planning and Investment Strategies',
    instructor: 'James Wilson',
    rating: 4.6,
    reviewCount: 734,
    price: 79.99,
    discountPrice: 17.99,
    imageSrc: 'https://images.unsplash.com/photo-1521790361543-f645cf042ec4?q=80&w=640',
    category: 'Finance',
    level: 'Beginner'
  },
  {
    id: '10',
    title: 'iOS App Development with Swift',
    instructor: 'Sophia Chen',
    rating: 4.8,
    reviewCount: 621,
    price: 109.99,
    discountPrice: 23.99,
    imageSrc: 'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?q=80&w=640',
    category: 'Development',
    level: 'Intermediate'
  },
  {
    id: '11',
    title: 'Public Speaking and Presentation Skills',
    instructor: 'Marcus Thomas',
    rating: 4.7,
    reviewCount: 845,
    price: 69.99,
    discountPrice: 15.99,
    imageSrc: 'https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?q=80&w=640',
    category: 'Personal Development',
    level: 'All Levels'
  }
]

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <HeroBanner />
      
      {/* Featured Courses */}
      <FeaturedCourses 
        title="Featured Courses" 
        subtitle="Learn the most in-demand skills with our top-rated courses"
        courses={featuredCourses}
      />
      
      {/* Popular Courses */}
      <FeaturedCourses 
        title="Most Popular" 
        subtitle="Our students' top picks in various categories"
        courses={popularCourses}
        className="bg-[#f7f9fa]"
      />
      
      {/* Why Opal Section */}
      <WhyOpal />
      
      {/* CTA Section */}
      <section className="py-16 bg-[#1c1d1f] text-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-8 md:mb-0 md:max-w-md">
              <h2 className="text-3xl font-bold mb-4">Become an instructor</h2>
              <p className="text-lg text-gray-300 mb-6">
                Share your expertise and earn income by creating AI-enhanced courses on Opal.
              </p>
              <Link href="/teach">
                <Button className="bg-white text-[#1c1d1f] hover:bg-gray-200 font-bold">
                  Start Teaching Today
                </Button>
              </Link>
            </div>
            <div className="flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=500"
                alt="Teaching online"
                className="rounded-lg shadow-lg max-w-sm w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
