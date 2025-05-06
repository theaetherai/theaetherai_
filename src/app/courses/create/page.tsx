import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import CourseEditor from '@/components/courses/course-editor'

export default async function CreateCoursePage() {
  const user = await currentUser()
  
  if (!user) {
    redirect('/auth/sign-in')
  }
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Create a New Course</h1>
      <CourseEditor />
    </div>
  )
} 