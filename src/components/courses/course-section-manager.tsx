'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronUp, Grip, Plus, Save, Trash2, Video, FileText, PencilLine, FileQuestion, FileEdit, FileVideo } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import LessonEditorSelector from './lesson-editors/LessonEditorSelector'
import { SafeNavButton } from '@/components/ui/safe-nav-button'
import { updateLessonProgress } from '@/lib/lesson-progress'
import { FeatureCheck } from '@/components/ui/feature-check'
import { FeatureUnavailableMessage } from '@/components/ui/feature-unavailable-message'
import { useRouteAvailability } from '@/hooks/useRouteAvailability'
import { Lesson } from '@/types/course'
import { Loader2 } from 'lucide-react'

interface Section {
  id: string
  title: string
  description?: string
  order: number
  lessons: Lesson[]
}

interface CourseSectionManagerProps {
  courseId: string
  initialSections?: Section[]
  onSectionsChange?: (sections: Section[]) => void
}

export default function CourseSectionManager({ 
  courseId, 
  initialSections = [],
  onSectionsChange
}: CourseSectionManagerProps) {
  const [sections, setSections] = useState<Section[]>(initialSections)
  const [loading, setLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [newSectionDescription, setNewSectionDescription] = useState('')
  const [expandedLessons, setExpandedLessons] = useState<string[]>([])
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [newLesson, setNewLesson] = useState<Partial<Lesson>>({})
  const [showNewLessonForm, setShowNewLessonForm] = useState(false)
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  // Fetch sections on initial load
  useEffect(() => {
    if (initialSections.length === 0) {
      fetchSections()
    }
  }, [courseId])
  
  const fetchSections = async () => {
    setLoading(true)
    
    try {
      const response = await axios.get(`/api/courses/${courseId}/sections`)
      
      if (response.data.status === 200) {
        setSections(response.data.data)
      }
    } catch (error) {
      toast.error('Failed to fetch course sections')
    } finally {
      setLoading(false)
    }
  }
  
  const addSection = async () => {
    setLoading(true)
    
    try {
      const response = await axios.post(`/api/courses/${courseId}/sections`, {
        title: 'New Section',
        order: sections.length
      })
      
      if (response.data.status === 201) {
        const newSection = response.data.data
        const updatedSections = [...sections, newSection];
        setSections(updatedSections)
        onSectionsChange?.(updatedSections);
        setExpandedSections([...expandedSections, newSection.id])
        setEditingSectionId(newSection.id)
        setNewSectionTitle('New Section')
        setNewSectionDescription('')
      }
    } catch (error) {
      toast.error('Failed to add section')
    } finally {
      setLoading(false)
    }
  }
  
  const updateSectionOrder = async (updatedSections: Section[]) => {
    try {
      const orderedSections = updatedSections.map((section, index) => ({
        id: section.id,
        order: index
      }))
      
      await axios.put(`/api/courses/${courseId}/sections/reorder`, {
        sections: orderedSections
      })
      
      setSections(updatedSections)
      onSectionsChange?.(updatedSections);
    } catch (error) {
      toast.error('Failed to update section order')
    }
  }
  
  const handleSectionDragEnd = (event: any) => {
    const { active, over } = event
    
    if (active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        
        const newItems = arrayMove(items, oldIndex, newIndex)
        
        updateSectionOrder(newItems)
        return newItems
      })
    }
  }
  
  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section and all its lessons?')) {
      return
    }
    
    setLoading(true)
    
    try {
      await axios.delete(`/api/courses/${courseId}/sections/${sectionId}`)
      
      const updatedSections = sections.filter(section => section.id !== sectionId);
      setSections(updatedSections)
      onSectionsChange?.(updatedSections);
      setExpandedSections(expandedSections.filter(id => id !== sectionId))
      toast.success('Section deleted successfully')
    } catch (error) {
      toast.error('Failed to delete section')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSaveSection = async (sectionId: string) => {
    setLoading(true)
    
    try {
      await axios.patch(`/api/courses/${courseId}/sections/${sectionId}`, {
        title: newSectionTitle,
        description: newSectionDescription
      })
      
      setSections(sections.map(section => 
        section.id === sectionId 
          ? { ...section, title: newSectionTitle, description: newSectionDescription }
          : section
      ))
      
      setEditingSectionId(null)
      toast.success('Section updated successfully')
    } catch (error) {
      toast.error('Failed to update section')
    } finally {
      setLoading(false)
    }
  }
  
  const handleEditSection = (section: Section) => {
    setEditingSectionId(section.id)
    setNewSectionTitle(section.title)
    setNewSectionDescription(section.description || '')
  }
  
  const addLesson = async (sectionId: string) => {
    setLoading(true)
    
    try {
      const section = sections.find(s => s.id === sectionId)
      const lessonCount = section?.lessons.length || 0
      
      const response = await axios.post(`/api/courses/${courseId}/sections/${sectionId}/lessons`, {
        title: 'New Lesson',
        type: 'video',
        order: lessonCount,
        previewable: false
      })
      
      if (response.data.status === 201) {
        const newLesson = response.data.data
        
        const updatedSections = sections.map(section => 
          section.id === sectionId 
            ? { ...section, lessons: [...section.lessons, newLesson] }
            : section
        );
        
        setSections(updatedSections)
        onSectionsChange?.(updatedSections);
        
        setExpandedLessons([...expandedLessons, newLesson.id])
        setEditingLessonId(newLesson.id)
      }
    } catch (error) {
      toast.error('Failed to add lesson')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDeleteLesson = async (sectionId: string, lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return
    }
    
    setLoading(true)
    
    try {
      await axios.delete(`/api/courses/${courseId}/lessons/${lessonId}`)
      
      const updatedSections = sections.map(section => 
        section.id === sectionId 
          ? { 
              ...section, 
              lessons: section.lessons.filter(lesson => lesson.id !== lessonId) 
            }
          : section
      );
      
      setSections(updatedSections)
      onSectionsChange?.(updatedSections);
      
      setExpandedLessons(expandedLessons.filter(id => id !== lessonId))
      toast.success('Lesson deleted successfully')
    } catch (error) {
      toast.error('Failed to delete lesson')
    } finally {
      setLoading(false)
    }
  }
  
  const updateLesson = async (sectionId: string, lessonId: string, data: Partial<Lesson>) => {
    setLoading(true)
    
    try {
      await axios.patch(`/api/courses/${courseId}/lessons/${lessonId}`, data)
      
      const updatedSections = sections.map(section => 
        section.id === sectionId 
          ? { 
              ...section, 
              lessons: section.lessons.map(lesson => 
                lesson.id === lessonId 
                  ? { ...lesson, ...data }
                  : lesson
              ) 
            }
          : section
      );
      
      setSections(updatedSections)
      onSectionsChange?.(updatedSections);
      
      toast.success('Lesson updated successfully')
    } catch (error) {
      toast.error('Failed to update lesson')
    } finally {
      setLoading(false)
    }
  }
  
  const toggleSectionExpanded = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }
  
  const toggleLessonExpanded = (lessonId: string) => {
    setExpandedLessons(prev => 
      prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    )
  }
  
  const handleAddSection = async () => {
    setLoading(true)
    
    try {
      const response = await axios.post(`/api/courses/${courseId}/sections`, {
        title: 'New Section',
        order: sections.length
      })
      
      if (response.data.status === 201) {
        const newSection = response.data.data
        const updatedSections = [...sections, newSection];
        setSections(updatedSections)
        onSectionsChange?.(updatedSections);
        setExpandedSections([...expandedSections, newSection.id])
        setEditingSectionId(newSection.id)
        setNewSectionTitle('New Section')
        setNewSectionDescription('')
      }
    } catch (error) {
      toast.error('Failed to add section')
    } finally {
      setLoading(false)
    }
  }
  
  const handleCancelAddSection = () => {
    setNewSectionTitle('')
    setNewSectionDescription('')
    setEditingSectionId(null)
  }
  
  const handleAddLesson = async (sectionId: string) => {
    setLoading(true)
    
    try {
      const response = await axios.post(`/api/courses/${courseId}/sections/${sectionId}/lessons`, newLesson)
      
      if (response.data.status === 201) {
        const newLesson = response.data.data
        
        const updatedSections = sections.map(section => 
          section.id === sectionId 
            ? { ...section, lessons: [...section.lessons, newLesson] }
            : section
        );
        
        setSections(updatedSections)
        onSectionsChange?.(updatedSections);
        
        setExpandedLessons([...expandedLessons, newLesson.id])
        setEditingLessonId(newLesson.id)
      }
    } catch (error) {
      toast.error('Failed to add lesson')
    } finally {
      setLoading(false)
    }
  }
  
  const handleMoveLesson = (index: number, direction: 'up' | 'down', sectionIndex: number) => {
    setSections((prevSections) => {
      const sections = [...prevSections];
      const section = sections[sectionIndex];
      const lessons = [...section.lessons];
      const lesson = lessons[index];

      if (direction === 'up') {
        if (index > 0) {
          lessons.splice(index - 1, 2, lessons[index], lessons[index - 1]);
        }
      } else if (direction === 'down') {
        if (index < lessons.length - 1) {
          lessons.splice(index, 2, lessons[index + 1], lessons[index]);
        }
      }

      const updatedSections = sections.map((s, i) =>
        i === sectionIndex ? { ...s, lessons } : s
      );

      return updatedSections;
    });
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id)
    setNewLesson({
      title: lesson.title,
      description: lesson.description || '',
      type: lesson.type,
      duration: lesson.duration,
      previewable: lesson.previewable
    })
    setShowNewLessonForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Course Content</h2>
        <Button
          onClick={handleAddSection}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Section
        </Button>
      </div>
      
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleSectionDragEnd}
      >
        <SortableContext
          items={sections.map(section => section.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {sections.map((section, sectionIndex) => (
              <SortableSection
                key={section.id}
                section={section}
                expanded={expandedSections.includes(section.id)}
                onToggleExpand={() => toggleSectionExpanded(section.id)}
                onDelete={() => handleDeleteSection(section.id)}
                onEdit={() => handleEditSection(section)}
                isEditing={editingSectionId === section.id}
                newTitle={newSectionTitle}
                newDescription={newSectionDescription}
                onTitleChange={setNewSectionTitle}
                onDescriptionChange={setNewSectionDescription}
                onSave={() => handleSaveSection(section.id)}
                expandedLessons={expandedLessons}
                toggleLessonExpanded={toggleLessonExpanded}
                editingLessonId={editingLessonId}
                setEditingLessonId={setEditingLessonId}
                courseId={courseId}
                onAddLesson={() => addLesson(section.id)}
                onDeleteLesson={(lessonId) => handleDeleteLesson(section.id, lessonId)}
                onUpdateLesson={(lessonId, data) => updateLesson(section.id, lessonId, data)}
                loading={loading}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      {sections.length === 0 && !loading && (
        <div className="text-center p-8 border border-dashed border-border rounded-lg">
          <p className="text-foreground text-lg mb-4">No sections yet</p>
          <Button
            onClick={handleAddSection}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Section
          </Button>
        </div>
      )}

      {showNewLessonForm && (
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-foreground">Add New Lesson</CardTitle>
                <CardDescription>
                  Create a new lesson in this section
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Lesson title"
              value={newLesson.title}
              onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
              className="bg-background border-border text-foreground"
            />
    
            <Textarea
              placeholder="Lesson description (optional)"
              value={newLesson.description || ''}
              onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
              className="h-20 bg-background border-border text-foreground"
            />
    
            <div>
              <Label className="mb-2 block">Lesson Type</Label>
              <Select 
                value={newLesson.type}
                onValueChange={(value) => setNewLesson({ 
                  ...newLesson, 
                  type: value as 'video' | 'text' | 'quiz' | 'assignment'
                })}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select a lesson type" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground max-h-[200px]">
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newLesson.type === 'video' && (
              <div>
                <Label className="mb-2 block">Video Duration (minutes)</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Duration in minutes"
                  value={newLesson.duration || ''}
                  onChange={(e) => setNewLesson({ 
                    ...newLesson, 
                    duration: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  className="bg-background border-border text-foreground"
                />
              </div>
            )}
            
            <div className="bg-background p-3 rounded-md">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isPreviewable"
                  checked={newLesson.previewable}
                  onCheckedChange={(checked) => setNewLesson({
                    ...newLesson,
                    previewable: !!checked
                  })}
                />
                <Label htmlFor="isPreviewable">Available in free preview</Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setShowNewLessonForm(false)}
              className="bg-background hover:bg-muted/50 text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const targetSectionId = Object.keys(sections).length > 0 ? sections[0].id : '';
                handleAddLesson(targetSectionId);
              }}
              disabled={!newLesson.title || loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding Lesson...
                </>
              ) : (
                <>Add Lesson</>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

interface SortableSectionProps {
  section: Section
  expanded: boolean
  onToggleExpand: () => void
  onDelete: () => void
  onEdit: () => void
  isEditing: boolean
  newTitle: string
  newDescription: string
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onSave: () => void
  expandedLessons: string[]
  toggleLessonExpanded: (lessonId: string) => void
  editingLessonId: string | null
  setEditingLessonId: (id: string | null) => void
  courseId: string
  onAddLesson: () => void
  onDeleteLesson: (lessonId: string) => void
  onUpdateLesson: (lessonId: string, data: Partial<Lesson>) => void
  loading: boolean
}

function SortableSection({
  section,
  expanded,
  onToggleExpand,
  onDelete,
  onEdit,
  isEditing,
  newTitle,
  newDescription,
  onTitleChange,
  onDescriptionChange,
  onSave,
  expandedLessons,
  toggleLessonExpanded,
  editingLessonId,
  setEditingLessonId,
  courseId,
  onAddLesson,
  onDeleteLesson,
  onUpdateLesson,
  loading
}: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: section.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="bg-background rounded-lg border border-border"
    >
      <div className="flex items-center p-4 gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-move text-muted-foreground hover:text-foreground p-1"
        >
          <Grip className="h-5 w-5" />
        </div>
        
        {isEditing ? (
          <div className="flex-1">
            <Input
              value={newTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Section title"
              className="mb-2 bg-background border-border text-foreground"
            />
            <Textarea
              value={newDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Section description (optional)"
              className="h-20 bg-background border-border text-foreground"
            />
            <div className="flex gap-2 mt-2">
              <Button
                onClick={onSave}
                disabled={loading}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Save className="h-4 w-4 mr-2" /> Save
              </Button>
              <Button
                onClick={() => setEditingLessonId(null)}
                variant="outline"
                size="sm"
                disabled={loading}
                className="bg-transparent border-border text-foreground hover:bg-muted/50"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div 
              onClick={onToggleExpand} 
              className="flex-1 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">{section.title}</h3>
                {expanded ? <ChevronUp className="h-5 w-5 text-foreground" /> : <ChevronDown className="h-5 w-5 text-foreground" />}
              </div>
              {section.description && (
                <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
              )}
              <div className="text-xs text-muted-foreground/70 mt-1">
                {section.lessons.length} {section.lessons.length === 1 ? 'lesson' : 'lessons'}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={onEdit}
                size="sm"
                variant="ghost"
                className="text-foreground hover:bg-muted/50"
              >
                <PencilLine className="h-4 w-4" />
              </Button>
              <Button
                onClick={onDelete}
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive/90 hover:bg-transparent"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
      
      {expanded && !isEditing && (
        <div className="p-4 pt-0 space-y-3">
          {section.lessons.map((lesson, index) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              expanded={expandedLessons.includes(lesson.id)}
              onToggleExpand={() => toggleLessonExpanded(lesson.id)}
              isEditing={editingLessonId === lesson.id}
              setEditingLessonId={setEditingLessonId}
              onDeleteLesson={() => onDeleteLesson(lesson.id)}
              onUpdateLesson={(data) => onUpdateLesson(lesson.id, data)}
              courseId={courseId}
              loading={loading}
            />
          ))}
          
          <Button
            onClick={onAddLesson}
            disabled={loading}
            variant="outline"
            size="sm"
            className="w-full mt-2 bg-transparent border-dashed border-border text-foreground hover:bg-muted/50"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Lesson
          </Button>
        </div>
      )}
    </div>
  )
}

interface LessonItemProps {
  lesson: Lesson
  expanded: boolean
  onToggleExpand: () => void
  isEditing: boolean
  setEditingLessonId: (id: string | null) => void
  onDeleteLesson: () => void
  onUpdateLesson: (data: Partial<Lesson>) => void
  courseId: string
  loading: boolean
}

export function LessonItem({
  lesson,
  expanded,
  onToggleExpand,
  isEditing,
  setEditingLessonId,
  onDeleteLesson,
  onUpdateLesson,
  courseId,
  loading
}: LessonItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoPreviewAvailable, setVideoPreviewAvailable] = useState<boolean | null>(null)
  const { checkRouteExists } = useRouteAvailability()
  
  // Add local state for form values
  const [formValues, setFormValues] = useState({
    title: lesson.title,
    description: lesson.description || '',
    type: lesson.type,
    videoId: lesson.videoId || '',
    content: lesson.content || '',
    previewable: lesson.previewable
  })
  
  useEffect(() => {
    // Update local state when lesson data changes
    setFormValues({
      title: lesson.title,
      description: lesson.description || '',
      type: lesson.type,
      videoId: lesson.videoId || '',
      content: lesson.content || '',
      previewable: lesson.previewable
    })
  }, [lesson])
  
  useEffect(() => {
    if (lesson.type === 'video' && lesson.videoId) {
      checkRouteExists(`/api/videos/${lesson.videoId}/status`).then(exists => {
        setVideoPreviewAvailable(exists)
      })
    }
  }, [lesson, checkRouteExists])
  
  // Handle save changes
  const handleSaveChanges = () => {
    // Only send changes that differ from the original lesson
    const changes: Partial<Lesson> = {};
    
    if (formValues.title !== lesson.title) changes.title = formValues.title;
    if (formValues.description !== lesson.description) changes.description = formValues.description;
    if (formValues.type !== lesson.type) changes.type = formValues.type;
    if (formValues.videoId !== lesson.videoId) changes.videoId = formValues.videoId;
    if (formValues.content !== lesson.content) changes.content = formValues.content;
    if (formValues.previewable !== lesson.previewable) changes.previewable = formValues.previewable;
    
    // Only call API if there are changes
    if (Object.keys(changes).length > 0) {
      onUpdateLesson(changes);
    }
    
    // Close edit mode
    setEditingLessonId(null);
  }
  
  // Handle form value changes
  const updateFormValue = (field: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  }
  
  const renderLessonPreview = () => {
    switch (lesson.type) {
      case 'video':
        return (
          <FeatureCheck
            route={`/api/videos/${lesson.videoId}/status`}
            fallback={
              <div className="bg-background rounded-md aspect-video flex items-center justify-center">
                <FeatureUnavailableMessage
                  title="Video Preview Not Available"
                  description="Video preview is not yet available, but students will be able to view the video in the course."
                  type="info"
                  className="w-full max-w-md"
                />
              </div>
            }
          >
            {lesson.videoId ? (
              <div className="rounded-md overflow-hidden bg-black aspect-video">
                <video
                  ref={videoRef}
                  src={lesson.video?.source}
                  className="w-full h-full object-contain"
                  controls
                />
              </div>
            ) : (
              <div className="bg-background rounded-md aspect-video flex items-center justify-center text-muted-foreground">
                No video selected
              </div>
            )}
          </FeatureCheck>
        )
        
      case 'text':
        return (
          <div 
            className="prose prose-invert max-w-none text-sm rounded-md overflow-hidden bg-background p-4"
            style={{ maxHeight: '200px', overflowY: 'auto' }}
          >
            {lesson.content ? (
              <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
            ) : (
              <p className="text-muted-foreground">No content yet</p>
            )}
          </div>
        )
        
      case 'quiz':
        return (
          <FeatureCheck
            route={`/api/courses/lessons/${lesson.id}/quiz-attempt`}
            fallback={
              <div className="bg-background rounded-md p-4 flex items-center justify-center">
                <FeatureUnavailableMessage
                  title="Quiz Preview"
                  description={`This quiz has ${
                    lesson.questions && typeof lesson.questions === 'object' 
                      ? Array.isArray(lesson.questions) 
                        ? lesson.questions.length 
                        : Object.keys(lesson.questions).length
                      : 0
                  } questions. Quiz submission is not yet available.`}
                  type="quiz"
                  className="w-full max-w-md"
                />
              </div>
            }
          >
            <div className="bg-background rounded-md p-4">
              <h3 className="text-foreground font-medium mb-2">Quiz Preview</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {lesson.questions && typeof lesson.questions === 'object' 
                  ? `This quiz has ${
                      Array.isArray(lesson.questions) 
                        ? lesson.questions.length 
                        : Object.keys(lesson.questions).length
                    } questions.`
                  : 'No questions added yet.'}
              </p>
              {lesson.passingScore && (
                <div className="text-muted-foreground text-sm">
                  <span className="font-medium text-foreground">Passing score:</span> {lesson.passingScore}%
                </div>
              )}
              {lesson.timeLimit && (
                <div className="text-muted-foreground text-sm">
                  <span className="font-medium text-foreground">Time limit:</span> {lesson.timeLimit} minutes
                </div>
              )}
            </div>
          </FeatureCheck>
        )
        
      case 'assignment':
        return (
          <FeatureCheck
            route={`/api/courses/lessons/${lesson.id}/assignment-submission`}
            fallback={
              <div className="bg-background rounded-md p-4 flex items-center justify-center">
                <FeatureUnavailableMessage
                  title="Assignment Preview"
                  description="Assignment submission is not yet available."
                  type="assignment"
                  className="w-full max-w-md"
                />
              </div>
            }
          >
            <div className="bg-background rounded-md p-4">
              <h3 className="text-foreground font-medium mb-2">Assignment Preview</h3>
              <div className="text-muted-foreground text-sm max-h-[150px] overflow-y-auto">
                {lesson.content ? (
                  <div 
                    className="prose prose-invert max-w-none text-sm"
                    dangerouslySetInnerHTML={{ __html: lesson.content }}
                  />
                ) : (
                  <p>No instructions provided yet.</p>
                )}
              </div>
              {lesson.dueDate && (
                <div className="mt-2 text-muted-foreground text-sm">
                  <span className="font-medium text-foreground">Due date:</span> {new Date(lesson.dueDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </FeatureCheck>
        )
        
      default:
        return (
          <div className="bg-background rounded-md p-4 text-muted-foreground text-center">
            Unknown lesson type: {lesson.type}
          </div>
        )
    }
  }

  return (
    <Card className="bg-card border-border">
      {isEditing ? (
        <CardContent className="p-4">
          <div className="space-y-4">
            <div>
              <Label className="text-foreground mb-2 block">Lesson Title</Label>
              <Input
                value={formValues.title}
                onChange={(e) => updateFormValue('title', e.target.value)}
                placeholder="Lesson title"
                className="bg-background border-border text-foreground"
              />
            </div>
            
            <div>
              <Label className="text-foreground mb-2 block">Lesson Type</Label>
              <Select
                value={formValues.type}
                onValueChange={(value: any) => updateFormValue('type', value)}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select lesson type" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground">
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-foreground mb-2 block">Description</Label>
              <Textarea
                value={formValues.description}
                onChange={(e) => updateFormValue('description', e.target.value)}
                placeholder="Brief description of this lesson"
                className="h-20 bg-background border-border text-foreground"
              />
            </div>
            
            {formValues.type === 'video' && (
              <div>
                <Label className="text-foreground mb-2 block">Select Video</Label>
                <Select
                  value={formValues.videoId}
                  onValueChange={(value: any) => updateFormValue('videoId', value)}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Select a video" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border text-foreground max-h-[200px]">
                    {videoPreviewAvailable === null ? (
                      <div className="p-2 text-center">Loading video status...</div>
                    ) : videoPreviewAvailable ? (
                      <div className="p-2 text-center">Video preview available</div>
                    ) : (
                      <div className="p-2 text-center">Video preview not available</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {formValues.type === 'text' && (
              <div>
                <Label className="text-foreground mb-2 block">Lesson Content</Label>
                <Textarea
                  value={formValues.content}
                  onChange={(e) => updateFormValue('content', e.target.value)}
                  placeholder="Enter the text content for this lesson"
                  className="h-40 bg-background border-border text-foreground"
                />
              </div>
            )}
            
            {(formValues.type === 'quiz' || formValues.type === 'assignment') && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-foreground text-sm">
                  To add {formValues.type === 'quiz' ? 'questions to this quiz' : 'details to this assignment'}, 
                  save this lesson first, then use the advanced editor from the lesson actions menu.
                </p>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="previewable"
                checked={formValues.previewable}
                onCheckedChange={(checked) => updateFormValue('previewable', !!checked)}
                className="data-[state=checked]:bg-primary"
              />
              <Label
                htmlFor="previewable"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground"
              >
                Available in free preview
              </Label>
            </div>
            
            <div className="flex gap-2 mt-2">
              <Button
                onClick={handleSaveChanges}
                disabled={loading}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Save className="h-4 w-4 mr-2" /> Save
              </Button>
              <Button
                onClick={() => setEditingLessonId(null)}
                variant="outline"
                size="sm"
                disabled={loading}
                className="bg-transparent border-border text-foreground hover:bg-muted/50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      ) : (
        <>
          <CardHeader 
            className="p-3 flex flex-row items-center justify-between cursor-pointer" 
            onClick={onToggleExpand}
          >
            <div className="flex items-center gap-2">
              {renderLessonTypeIcon(lesson.type)}
              <CardTitle className="text-base text-foreground">{lesson.title}</CardTitle>
              {lesson.previewable && (
                <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded">
                  Preview
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {lesson.duration && (
                <span className="text-xs text-muted-foreground">{lesson.duration} min</span>
              )}
              <div className="flex gap-1">
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingLessonId(lesson.id)
                  }}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-foreground hover:bg-muted/50"
                >
                  <PencilLine className="h-4 w-4" />
                </Button>

                <Dialog open={false} onOpenChange={() => {}}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Check if the lesson editor route exists
                        checkRouteExists(`/api/courses/lessons/${lesson.id}`).then(exists => {
                          if (!exists) {
                            toast.warning("Advanced lesson editor is not available yet");
                            return;
                          }
                          setEditingLessonId(lesson.id);
                        })
                      }}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-blue-400 hover:text-blue-500 hover:bg-muted/50"
                    >
                      <FileEdit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-y-auto">
                    <LessonEditorSelector 
                      lessonId={lesson.id}
                      courseId={courseId}
                      defaultType={lesson.type}
                      onSave={() => setEditingLessonId(null)}
                      onCancel={() => setEditingLessonId(null)}
                    />
                  </DialogContent>
                </Dialog>
                
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteLesson()
                  }}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-transparent"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {expanded ? 
                <ChevronUp className="h-4 w-4 text-foreground" /> : 
                <ChevronDown className="h-4 w-4 text-foreground" />
              }
            </div>
          </CardHeader>
          
          {expanded && (
            <CardContent className="px-3 pt-0 pb-3">
              {lesson.description && (
                <p className="text-sm text-muted-foreground mb-2">{lesson.description}</p>
              )}
              
              {lesson.type === 'video' && lesson.videoId && (
                <div className="bg-muted p-2 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">
                      Video: {videoPreviewAvailable === null ? 'Loading...' : videoPreviewAvailable ? 'Preview available' : 'Preview not available'}
                    </span>
                  </div>
                </div>
              )}
              
              {lesson.type === 'text' && lesson.content && (
                <div className="bg-muted p-2 rounded-md mt-2">
                  <div className="text-xs text-muted-foreground">
                    {lesson.content.length > 100 
                      ? `${lesson.content.substring(0, 100)}...` 
                      : lesson.content}
                  </div>
                </div>
              )}
              
              {lesson.type === 'quiz' && (
                <div className="bg-muted p-2 rounded-md mt-2">
                  <span className="text-xs text-muted-foreground">
                    This lesson contains a quiz. Use the advanced editor to add questions.
                  </span>
                </div>
              )}
              
              {lesson.type === 'assignment' && (
                <div className="bg-muted p-2 rounded-md mt-2">
                  <span className="text-xs text-muted-foreground">
                    This lesson contains an assignment. Use the advanced editor to add details.
                  </span>
                </div>
              )}
            </CardContent>
          )}
        </>
      )}
    </Card>
  )
}

// Helper function to render icons for lesson types
function renderLessonTypeIcon(type: string) {
  switch (type) {
    case 'video':
      return <FileVideo className="h-4 w-4 text-blue-400" />;
    case 'text':
      return <FileText className="h-4 w-4 text-green-400" />;
    case 'quiz':
      return <FileQuestion className="h-4 w-4 text-amber-400" />;
    case 'assignment':
      return <FileEdit className="h-4 w-4 text-purple-400" />;
    default:
      return null;
  }
} 