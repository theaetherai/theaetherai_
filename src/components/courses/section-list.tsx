'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Film, GripVertical, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd'

import { Button } from '@/components/ui/button'
import { Collapse } from '@/components/ui/collapse'
import { LessonRow } from './lesson-row'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface Section {
  id: string
  title: string
  order: number
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  content?: string | null
  order: number
  completed?: boolean
  duration?: number | null
  videoId?: string | null
  video?: {
    id: string
    title?: string | null
  } | null
}

interface SectionListProps {
  sections: Section[]
  courseId: string
  isOwner: boolean
}

export default function SectionList({
  sections: initialSections,
  courseId,
  isOwner
}: SectionListProps) {
  const router = useRouter()
  const [sections, setSections] = useState<Section[]>(initialSections)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    // Initialize with all sections expanded
    initialSections.reduce((acc, section) => ({ ...acc, [section.id]: true }), {})
  )
  const [isReordering, setIsReordering] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null)

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const { source, destination, type } = result

    // Handling section reordering
    if (type === 'section') {
      const reorderedSections = [...sections]
      const [movedSection] = reorderedSections.splice(source.index, 1)
      reorderedSections.splice(destination.index, 0, movedSection)

      // Update order numbers
      const updatedSections = reorderedSections.map((section, index) => ({
        ...section,
        order: index + 1
      }))

      setSections(updatedSections)

      // Save the new order to the server
      try {
        for (const section of updatedSections) {
          await axios.patch(`/api/courses/${courseId}/sections/${section.id}`, {
            order: section.order
          })
        }
        toast.success('Section order updated')
      } catch (error) {
        toast.error('Failed to update section order')
      }
    }

    // Handling lesson reordering within the same section
    if (type === 'lesson') {
      const sourceSectionId = source.droppableId
      const destinationSectionId = destination.droppableId

      // Clone current sections
      const updatedSections = [...sections]

      // Find source and destination section indices
      const sourceSectionIndex = updatedSections.findIndex(s => s.id === sourceSectionId)
      
      // If reordering within the same section
      if (sourceSectionId === destinationSectionId) {
        const sectionLessons = [...updatedSections[sourceSectionIndex].lessons]
        const [movedLesson] = sectionLessons.splice(source.index, 1)
        sectionLessons.splice(destination.index, 0, movedLesson)

        // Update lesson order numbers
        const reorderedLessons = sectionLessons.map((lesson, index) => ({
          ...lesson,
          order: index + 1
        }))

        updatedSections[sourceSectionIndex].lessons = reorderedLessons
        setSections(updatedSections)

        // Save the new lesson order to the server
        try {
          for (const lesson of reorderedLessons) {
            await axios.patch(`/api/courses/${courseId}/lessons/${lesson.id}`, {
              order: lesson.order
            })
          }
          toast.success('Lesson order updated')
        } catch (error) {
          toast.error('Failed to update lesson order')
        }
      } 
      // If moving between sections
      else {
        const destSectionIndex = updatedSections.findIndex(s => s.id === destinationSectionId)
        
        // Get the lesson to move
        const sourceLessons = [...updatedSections[sourceSectionIndex].lessons]
        const [movedLesson] = sourceLessons.splice(source.index, 1)
        
        // Add to destination section
        const destLessons = [...updatedSections[destSectionIndex].lessons]
        destLessons.splice(destination.index, 0, movedLesson)
        
        // Update orders in both sections
        const reorderedSourceLessons = sourceLessons.map((lesson, index) => ({
          ...lesson,
          order: index + 1
        }))
        
        const reorderedDestLessons = destLessons.map((lesson, index) => ({
          ...lesson,
          order: index + 1,
          sectionId: destinationSectionId // Update the section ID
        }))
        
        updatedSections[sourceSectionIndex].lessons = reorderedSourceLessons
        updatedSections[destSectionIndex].lessons = reorderedDestLessons
        
        setSections(updatedSections)
        
        // Save changes to server
        try {
          // Update all source section lessons
          for (const lesson of reorderedSourceLessons) {
            await axios.patch(`/api/courses/${courseId}/lessons/${lesson.id}`, {
              order: lesson.order
            })
          }
          
          // Update all destination section lessons
          for (const lesson of reorderedDestLessons) {
            await axios.patch(`/api/courses/${courseId}/lessons/${lesson.id}`, {
              order: lesson.order,
              sectionId: destinationSectionId
            })
          }
          
          toast.success('Lesson moved to new section')
        } catch (error) {
          toast.error('Failed to move lesson')
        }
      }
    }
  }

  const toggleReordering = () => {
    setIsReordering(!isReordering)
  }

  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) {
      toast.error('Section title cannot be empty')
      return
    }

    setIsLoading(true)

    try {
      const response = await axios.post(`/api/courses/${courseId}/sections`, {
        title: newSectionTitle,
        order: sections.length + 1
      })

      if (response.data.status === 201) {
        const newSection = response.data.data
        setSections([...sections, { ...newSection, lessons: [] }])
        setNewSectionTitle('')
        setIsAddSectionOpen(false)
        toast.success('Section added successfully')
      } else {
        toast.error('Failed to add section: ' + (response.data.error || 'Unknown error'))
        console.error('Section add error:', response.data)
      }
    } catch (error: any) {
      toast.error('Failed to add section: ' + (error?.response?.data?.error || error?.message || 'Unknown error'))
      console.error('Section add error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section? All lessons in this section will be moved to Uncategorized.')) {
      return
    }

    setDeletingSectionId(sectionId)

    try {
      const response = await axios.delete(`/api/courses/${courseId}/sections/${sectionId}`)

      if (response.data.status === 200) {
        setSections(sections.filter(section => section.id !== sectionId))
        toast.success('Section deleted successfully')
      }
    } catch (error) {
      toast.error('Failed to delete section')
    } finally {
      setDeletingSectionId(null)
    }
  }

  const handleAddLesson = () => {
    router.push(`/courses/${courseId}/lessons/create`)
  }

  // Count total lessons across all sections
  const totalLessonsCount = sections.reduce((total, section) => 
    total + section.lessons.length, 0
  )

  if (sections.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-lg">
        <p className="text-muted-foreground mb-4">No sections available for this course yet</p>
        {isOwner && (
          <Button onClick={() => setIsAddSectionOpen(true)} className="text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add your first section
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {!isOwner && sections.length === 0 && (
        <p className="text-muted-foreground mb-4">No sections available for this course yet</p>
      )}
      
      {isOwner && (
        <div className="flex flex-wrap gap-3 items-center mb-6">
          <Dialog open={isAddSectionOpen} onOpenChange={setIsAddSectionOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" /> Add Section
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Add New Section</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-3">
                <div className="space-y-2">
                  <Label htmlFor="sectionTitle" className="text-foreground">Section Title</Label>
                  <Input 
                    id="sectionTitle"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    placeholder="Enter section title"
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddSectionOpen(false)}
                  className="bg-background border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddSection}
                  disabled={!newSectionTitle.trim() || isLoading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isLoading ? 'Adding...' : 'Add Section'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button 
            onClick={toggleReordering}
            variant="outline"
            className={cn(
              "bg-background border-border text-foreground hover:bg-muted",
              isReordering && "border-primary bg-primary/10 text-primary"
            )}
          >
            {isReordering ? 'Done Reordering' : 'Reorder Sections & Lessons'}
          </Button>
          
          <Button
            onClick={handleAddLesson}
            variant="outline"
            className="bg-background border-border text-foreground hover:bg-muted"
          >
            <Film className="h-4 w-4 mr-2" /> Add Lesson
          </Button>
        </div>
      )}
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground">Course Sections</h3>
          <div className="text-sm text-muted-foreground">
            {totalLessonsCount} {totalLessonsCount === 1 ? 'lesson' : 'lessons'} in {sections.length} {sections.length === 1 ? 'section' : 'sections'}
          </div>
        </div>
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="sections" type="section">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                {sections.length > 0 ? (
                  sections.map((section, index) => (
                    <Draggable
                      key={section.id}
                      draggableId={section.id}
                      index={index}
                      isDragDisabled={!isReordering}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "border border-border rounded-lg overflow-hidden bg-card elevation-1",
                            isReordering && "border-border/60"
                          )}
                        >
                          <div 
                            className={cn(
                              "flex items-center justify-between p-4 border-b border-border",
                              isReordering && "bg-muted/30"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              {isReordering && (
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                                </div>
                              )}
                              <h4 className="font-medium text-foreground">{section.title}</h4>
                              <div className="text-xs text-muted-foreground">
                                {section.lessons.length} {section.lessons.length === 1 ? 'lesson' : 'lessons'}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {isOwner && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => setDeletingSectionId(section.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="bg-card border-border">
                                    <DialogHeader>
                                      <DialogTitle className="text-foreground">Delete Section</DialogTitle>
                                    </DialogHeader>
                                    <div className="py-3">
                                      <p className="text-muted-foreground">
                                        Are you sure you want to delete this section? All lessons will be moved to "Uncategorized".
                                      </p>
                                    </div>
                                    <DialogFooter>
                                      <Button 
                                        variant="outline" 
                                        onClick={() => setDeletingSectionId(null)}
                                        className="bg-background border-border text-foreground hover:bg-muted"
                                      >
                                        Cancel
                                      </Button>
                                      <Button 
                                        variant="destructive"
                                        onClick={() => deletingSectionId && handleDeleteSection(deletingSectionId)}
                                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                      >
                                        Delete Section
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              )}
                              
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                onClick={() => toggleSection(section.id)}
                              >
                                {expandedSections[section.id] ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Lessons List */}
                          <Collapse isOpen={expandedSections[section.id]}>
                            <Droppable droppableId={section.id} type="lesson">
                              {(provided) => (
                                <div
                                  {...provided.droppableProps}
                                  ref={provided.innerRef}
                                  className={cn(
                                    "p-4",
                                    isReordering && "bg-background/40"
                                  )}
                                >
                                  {section.lessons.length === 0 ? (
                                    <p className="text-muted-foreground py-2">
                                      No lessons in this section.
                                    </p>
                                  ) : (
                                    <div className="space-y-2" data-type="lesson">
                                      {section.lessons.map((lesson, index) => (
                                        <LessonRow
                                          key={lesson.id}
                                          lesson={lesson}
                                          index={index}
                                          courseId={courseId}
                                          isReordering={isReordering}
                                          isOwner={isOwner}
                                        />
                                      ))}
                                    </div>
                                  )}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </Collapse>
                        </div>
                      )}
                    </Draggable>
                  ))
                ) : (
                  <div className="rounded-lg border border-border p-8 text-center">
                    <p className="text-muted-foreground">No sections have been added to this course yet.</p>
                  </div>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  )
} 