'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookPlus, Edit, Trash2, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface CourseActionsProps {
  courseId: string
  isOwner: boolean
  isAdmin: boolean
  isInstructor: boolean
  canEdit: boolean
  canManage: boolean
  isEnrolled: boolean
}

export default function CourseActions({
  courseId,
  isOwner,
  isAdmin,
  isInstructor,
  canEdit,
  canManage,
  isEnrolled
}: CourseActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Handle course deletion
  const handleDelete = async () => {
    if (!canManage) return

    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    try {
      setIsDeleting(true)
      
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete course')
      }
      
      toast.success("Course Deleted", {
        description: "The course has been successfully deleted"
      })
      
      router.push('/courses')
    } catch (error) {
      console.error('Error deleting course:', error)
      toast.error("Error", {
        description: "Failed to delete course. Please try again."
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle enrollment
  const handleEnroll = async () => {
    if (isEnrolled || isOwner) return

    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to enroll in course')
      }
      
      toast.success("Enrolled Successfully", {
        description: "You have been enrolled in this course"
      })
      
      router.refresh()
    } catch (error) {
      console.error('Error enrolling in course:', error)
      toast.error("Error", {
        description: "Failed to enroll in course. Please try again."
      })
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Edit Course - Only for owners and admins */}
      {canEdit && (
        <Link href={`/courses/${courseId}/edit`}>
          <Button 
            variant="outline"
            className="bg-[#2A2A2A] hover:bg-[#3A3A3A] border-[#3A3A3A] text-white"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Course
          </Button>
        </Link>
      )}
      
      {/* Add Lesson - Only for owners and admins */}
      {canEdit && (
        <Link href={`/courses/${courseId}/lessons/create`}>
          <Button className="bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white">
            <BookPlus className="h-4 w-4 mr-2" />
            Add Lesson
          </Button>
        </Link>
      )}
      
      {/* Manage Students - Only for owners and admins */}
      {canManage && (
        <Link href={`/courses/${courseId}/students`}>
          <Button 
            variant="outline"
            className="bg-[#2A2A2A] hover:bg-[#3A3A3A] border-[#3A3A3A] text-white"
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Students
          </Button>
        </Link>
      )}
      
      {/* Enroll button - Only for non-owners who aren't enrolled */}
      {!isOwner && !isEnrolled && (
        <Button 
          onClick={handleEnroll}
          className="bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Enroll Now
        </Button>
      )}
      
      {/* Delete Course - Only for owners and admins */}
      {canManage && (
        <Button 
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {isDeleting ? 'Deleting...' : 'Delete Course'}
        </Button>
      )}
    </div>
  )
} 