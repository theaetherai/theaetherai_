'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CourseForm from './course-form'
import CourseSectionManager from './course-section-manager'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import axios from 'axios'
import { toast } from 'sonner'

interface Section {
  id: string
  title: string
  description?: string
  order: number
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  description?: string
  content?: string
  type: 'video' | 'text' | 'quiz' | 'assignment'
  order: number
  duration?: number
  previewable: boolean
  videoId?: string
}

interface Course {
  id?: string
  title: string
  description?: string | null
  shortDescription?: string | null
  price?: number | null
  discountPrice?: number | null
  thumbnailUrl?: string | null
  category?: string | null
  level?: string | null
  bestseller?: boolean
  featured?: boolean
  popular?: boolean
  published?: boolean
  requirements?: string[]
  objectives?: string[]
  targetAudience?: string | null
  sections?: Section[]
}

interface CourseEditorProps {
  courseId?: string
  initialData?: Course | null
  isEditing?: boolean
}

export default function CourseEditor({
  courseId,
  initialData,
  isEditing = false
}: CourseEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic-info')
  const [course, setCourse] = useState<Course | undefined>(initialData || undefined)
  const [sections, setSections] = useState<Section[]>(initialData?.sections || [])
  
  // Fetch course data if editing and no initial data
  useEffect(() => {
    if (isEditing && courseId && !initialData) {
      fetchCourseData()
    }
  }, [courseId, isEditing, initialData])
  
  const fetchCourseData = async () => {
    setLoading(true)
    
    try {
      const response = await axios.get(`/api/courses/${courseId}`)
      
      if (response.data.status === 200) {
        setCourse(response.data.data)
        
        // Fetch sections and lessons
        const sectionsResponse = await axios.get(`/api/courses/${courseId}/sections`)
        
        if (sectionsResponse.data.status === 200) {
          setSections(sectionsResponse.data.data)
        }
      }
    } catch (error) {
      toast.error('Failed to fetch course data')
    } finally {
      setLoading(false)
    }
  }
  
  const handleCourseCreated = (newCourse: Course) => {
    setCourse(newCourse)
    setActiveTab('content')
  }
  
  const handleCourseUpdated = (updatedCourse: Course) => {
    setCourse(updatedCourse)
    toast.success('Course basic info updated successfully')
  }
  
  const handlePublishCourse = async () => {
    if (!course?.id) return
    
    setLoading(true)
    
    try {
      await axios.patch(`/api/courses/${course.id}`, {
        published: true
      })
      
      toast.success('Course published successfully')
      router.push(`/courses/${course.id}`)
    } catch (error) {
      toast.error('Failed to publish course')
    } finally {
      setLoading(false)
    }
  }
  
  const handleMoveToNext = () => {
    if (activeTab === 'basic-info') {
      setActiveTab('content')
    } else if (activeTab === 'content') {
      setActiveTab('preview')
    }
  }
  
  const handleMoveToPrevious = () => {
    if (activeTab === 'content') {
      setActiveTab('basic-info')
    } else if (activeTab === 'preview') {
      setActiveTab('content')
    }
  }
  
  // Add a useEffect to help debug the sections and course data
  useEffect(() => {
    console.log("Current course data:", course);
    console.log("Current sections data:", sections);
  }, [course, sections]);
  
  return (
    <div className="max-w-7xl mx-auto">
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="mb-8">
          <TabsList className="grid grid-cols-3 w-full max-w-3xl mx-auto bg-background p-1 rounded-lg border border-border">
            <TabsTrigger 
              value="basic-info"
              disabled={loading}
              className="data-[state=active]:bg-muted data-[state=active]:text-foreground"
            >
              1. Basic Info
            </TabsTrigger>
            <TabsTrigger 
              value="content"
              disabled={loading || !course?.id}
              className="data-[state=active]:bg-muted data-[state=active]:text-foreground"
            >
              2. Content
            </TabsTrigger>
            <TabsTrigger 
              value="preview"
              disabled={loading || !course?.id || sections.length === 0}
              className="data-[state=active]:bg-muted data-[state=active]:text-foreground"
            >
              3. Preview & Publish
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="basic-info" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground">Course Information</CardTitle>
              <CardDescription>
                Fill in the basic details about your course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseForm 
                initialData={course} 
                courseId={course?.id}
                isEditing={!!course?.id}
                onCourseCreated={handleCourseCreated}
                onCourseUpdated={handleCourseUpdated}
              />
            </CardContent>
              <CardFooter className="flex justify-end border-t border-border/30 pt-4">
                <Button
                  onClick={handleMoveToNext}
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Next: Course Content <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="content" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground">Course Content</CardTitle>
              <CardDescription>
                Organize your course into sections and lessons
              </CardDescription>
            </CardHeader>
            <CardContent>
              {course?.id ? (
                <CourseSectionManager 
                  courseId={course.id}
                  initialSections={sections}
                  onSectionsChange={(updatedSections) => setSections(updatedSections)}
                />
              ) : (
                <div className="text-center p-8">
                  <p className="text-foreground text-lg">Create course basic info first</p>
                  <Button
                    onClick={() => setActiveTab('basic-info')}
                    className="mt-4 bg-muted hover:bg-muted/90 text-foreground"
                  >
                    Go to Basic Info
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border pt-4">
              <Button
                onClick={handleMoveToPrevious}
                variant="outline"
                disabled={loading}
                className="bg-transparent border-border text-foreground hover:bg-muted/50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Basic Info
              </Button>
              <Button
                onClick={handleMoveToNext}
                disabled={loading || sections.length === 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Next: Preview & Publish <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground">Preview & Publish</CardTitle>
              <CardDescription>
                Review your course and publish when ready
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-background/80 p-4 rounded-lg border border-border">
                  <h3 className="text-xl font-bold text-foreground mb-2">{course?.title}</h3>
                  
                  {course?.thumbnailUrl && (
                    <div className="aspect-video rounded-md overflow-hidden bg-background mb-4">
                      <img 
                        src={course.thumbnailUrl} 
                        alt={course.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-muted-foreground font-medium text-sm mb-1">Category</h4>
                      <p className="text-foreground">{course?.category || 'Not specified'}</p>
                    </div>
                    <div>
                      <h4 className="text-muted-foreground font-medium text-sm mb-1">Level</h4>
                      <p className="text-foreground">{course?.level || 'Not specified'}</p>
                    </div>
                    <div>
                      <h4 className="text-muted-foreground font-medium text-sm mb-1">Price</h4>
                      <p className="text-foreground">
                        {course?.price !== undefined && course?.price !== null ? `$${course.price}` : 'Free'}
                        {course?.discountPrice !== undefined && course?.discountPrice !== null && ` (Discounted: $${course.discountPrice})`}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-muted-foreground font-medium text-sm mb-1">Status</h4>
                      <p className="text-foreground">
                        {course?.published ? (
                          <span className="text-green-500">Published</span>
                        ) : (
                          <span className="text-yellow-500">Draft</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-muted-foreground font-medium text-sm mb-1">Description</h4>
                    <p className="text-foreground">{course?.description || 'No description provided'}</p>
                  </div>
                  
                  {course?.requirements && course.requirements.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-muted-foreground font-medium mb-1">Requirements</h4>
                      <ul className="list-disc pl-5 text-foreground">
                        {course.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {course?.objectives && course.objectives.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-muted-foreground font-medium mb-1">What You'll Learn</h4>
                      <ul className="list-disc pl-5 text-foreground">
                        {course.objectives.map((obj, index) => (
                          <li key={index}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="bg-background/80 p-4 rounded-lg border border-border">
                  <h3 className="text-xl font-bold text-foreground mb-4">Course Content</h3>
                  
                  <div className="space-y-4">
                    {sections.length > 0 ? (
                      sections.map((section, index) => (
                      <div key={section.id} className="border border-border rounded-lg overflow-hidden">
                        <div className="bg-background p-3">
                          <h4 className="text-foreground font-medium">
                            Section {index + 1}: {section.title}
                          </h4>
                          {section.description && (
                            <p className="text-sm text-muted-foreground">{section.description}</p>
                          )}
                        </div>
                        <div className="p-2">
                            {section.lessons && section.lessons.length > 0 ? (
                            <ul className="divide-y divide-border">
                              {section.lessons.map((lesson, lessonIndex) => (
                                <li key={lesson.id} className="py-2 px-3 flex items-center justify-between">
                                  <div className="flex items-center">
                                    <span className="text-muted-foreground mr-2">{lessonIndex + 1}.</span>
                                    <span className="text-foreground">{lesson.title}</span>
                                    {lesson.previewable && (
                                      <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                        Preview
                                      </span>
                                    )}
                                  </div>
                                    {lesson.duration !== undefined && lesson.duration !== null && (
                                    <span className="text-xs text-muted-foreground">{lesson.duration} min</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted-foreground text-center py-2">No lessons in this section</p>
                          )}
                        </div>
                      </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No sections added yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border pt-4">
              <Button
                onClick={handleMoveToPrevious}
                variant="outline"
                disabled={loading}
                className="bg-transparent border-border text-foreground hover:bg-muted/50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Content
              </Button>
              <Button
                onClick={handlePublishCourse}
                disabled={loading || !course?.id || sections.length === 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  course?.published ? 'Update Course' : 'Publish Course'
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 