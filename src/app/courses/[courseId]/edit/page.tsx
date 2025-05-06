import { currentUser } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import CourseEditor from '@/components/courses/course-editor'
import { client } from '@/lib/prisma'
import { Course } from '@/types/course'

interface EditCoursePageProps {
  params: {
    courseId: string
  }
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  console.log("Edit course page loading with courseId:", params.courseId);
  const user = await currentUser()
  
  if (!user) {
    console.log("No authenticated user found, redirecting to sign-in");
    redirect('/auth/sign-in')
  }
  
  console.log("User authenticated:", user.id);
  
  // Get user ID from database
  const dbUser = await client.user.findUnique({
    where: { 
      clerkid: user.id 
    },
    select: { id: true }
  });
  
  if (!dbUser) {
    console.log("Database user not found for clerk ID:", user.id);
    return redirect("/auth/sign-in");
  }
  
  console.log("Database user found:", dbUser.id);
  
  // Fetch the course
  const course = await client.course.findUnique({
    where: {
      id: params.courseId
    },
    include: {
      sections: {
        include: {
          lessons: true
        },
        orderBy: {
          order: 'asc'
        }
      }
    }
  })
  
  if (!course) {
    console.log("Course not found with ID:", params.courseId);
    notFound()
  }
  
  console.log("Course found:", course.id, course.title);
  
  // Check if the user is the owner of the course
  if (course.userId !== dbUser.id) {
    console.log("User is not the owner of this course, redirecting to courses");
    redirect('/courses')
  }
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Edit Course: {course.title}</h1>
      <CourseEditor 
        courseId={params.courseId}
        initialData={course as unknown as Course}
        isEditing={true}
      />
    </div>
  )
} 