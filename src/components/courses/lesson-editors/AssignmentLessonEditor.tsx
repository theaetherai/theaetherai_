'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { PencilLine, Save, Calendar, FileType, Plus, Trash2 } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'
import dynamic from 'next/dynamic'
import { FeatureCheck } from '@/components/ui/feature-check'
import { FeatureUnavailableMessage } from '@/components/ui/feature-unavailable-message'
import { useRouteAvailability } from '@/hooks/useRouteAvailability'

// Import rich text editor with dynamic import to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'

interface AssignmentLessonEditorProps {
  lessonId: string
  courseId: string
  initialData?: {
    title: string
    description?: string
    content?: string
    rubric?: any
    dueDate?: Date | null
    fileTypes?: string[]
    maxFileSize?: number
    maxFiles?: number
    previewable: boolean
  }
  onSave: () => void
  onCancel: () => void
}

type RubricItem = {
  id: string
  criterion: string
  points: number
  description: string
}

export default function AssignmentLessonEditor({
  lessonId,
  courseId,
  initialData,
  onSave,
  onCancel
}: AssignmentLessonEditorProps) {
  const { checkRouteExists } = useRouteAvailability()
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [rubric, setRubric] = useState<RubricItem[]>(initialData?.rubric || [])
  const [dueDate, setDueDate] = useState<Date | undefined>(
    initialData?.dueDate ? new Date(initialData.dueDate) : undefined
  )
  const [fileTypes, setFileTypes] = useState<string[]>(initialData?.fileTypes || ['pdf', 'doc', 'docx'])
  const [fileTypeInput, setFileTypeInput] = useState('')
  const [maxFileSize, setMaxFileSize] = useState(initialData?.maxFileSize?.toString() || '10')
  const [maxFiles, setMaxFiles] = useState(initialData?.maxFiles?.toString() || '1')
  const [previewable, setPreviewable] = useState(initialData?.previewable || false)
  const [loading, setLoading] = useState(false)
  const [submissionFeatureAvailable, setSubmissionFeatureAvailable] = useState<boolean | null>(null)
  
  // Check if the assignment submission API exists
  useEffect(() => {
    checkRouteExists(`/api/courses/lessons/${lessonId}/assignment-submission`).then(exists => {
      setSubmissionFeatureAvailable(exists)
    })
  }, [lessonId, checkRouteExists])
  
  const addRubricItem = () => {
    const newItem: RubricItem = {
      id: `r-${Date.now()}`,
      criterion: '',
      points: 10,
      description: ''
    }
    setRubric([...rubric, newItem])
  }
  
  const removeRubricItem = (id: string) => {
    setRubric(rubric.filter(item => item.id !== id))
  }
  
  const updateRubricItemField = (id: string, field: keyof RubricItem, value: string | number) => {
    setRubric(rubric.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }
  
  const addFileType = () => {
    if (fileTypeInput && !fileTypes.includes(fileTypeInput)) {
      setFileTypes([...fileTypes, fileTypeInput])
      setFileTypeInput('')
    }
  }
  
  const removeFileType = (type: string) => {
    setFileTypes(fileTypes.filter(t => t !== type))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    
    if (!content.trim()) {
      toast.error('Assignment instructions are required')
      return
    }
    
    // If the submission feature is not available, warn the user
    if (submissionFeatureAvailable === false && rubric.length > 0) {
      toast.warning('Note: Assignment submission feature is not fully implemented yet. The assignment structure will be saved, but students may not be able to submit assignments yet.')
    }
    
    setLoading(true)
    
    try {
      const response = await axios.patch(`/api/courses/lessons/${lessonId}`, {
        title,
        description,
        content,
        rubric: JSON.stringify(rubric),
        dueDate: dueDate ? dueDate.toISOString() : null,
        fileTypes,
        maxFileSize: parseInt(maxFileSize),
        maxFiles: parseInt(maxFiles),
        previewable
      })
      
      if (response.data.status === 200) {
        toast.success('Assignment updated successfully')
        onSave()
      }
    } catch (error) {
      console.error('Failed to update lesson', error)
      toast.error('Failed to update lesson')
    } finally {
      setLoading(false)
    }
  }

  // Rich text editor modules config
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image', 'code-block'],
      ['clean']
    ],
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground text-xl">
          <PencilLine className="h-5 w-5 text-primary" />
          Edit Assignment
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="title" className="text-foreground mb-2 block text-sm">Assignment Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter assignment title"
              className="bg-background border-input text-foreground"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description" className="text-foreground mb-2 block text-sm">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this assignment"
              className="h-20 bg-background border-input text-foreground"
            />
          </div>
          
          <div>
            <Label htmlFor="content" className="text-foreground mb-2 block text-sm">Assignment Instructions</Label>
            <div className="bg-background rounded-md text-foreground">
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                placeholder="Write detailed instructions for the assignment..."
                className="min-h-[300px] text-foreground"
                formats={[
                  'header', 'bold', 'italic', 'underline', 'strike',
                  'list', 'bullet', 'indent', 'link', 'image', 'align'
                ]}
                style={{ direction: 'ltr' }} // Ensure left-to-right text direction
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground mb-2 block text-sm">Due Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-background border-input text-foreground"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border-input">
                  <CalendarComponent
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className="bg-background text-foreground"
                  />
                </PopoverContent>
              </Popover>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDueDate(undefined)}
                className="mt-2 text-foreground"
              >
                Clear Date
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-foreground mb-2 block text-sm">Max File Size (MB)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  value={maxFileSize}
                  onChange={(e) => setMaxFileSize(e.target.value)}
                  placeholder="10"
                  min="1"
                  className="bg-background border-input text-foreground"
                />
              </div>
              
              <div>
                <Label className="text-foreground mb-2 block text-sm">Max Number of Files</Label>
                <Input
                  id="maxFiles"
                  type="number"
                  value={maxFiles}
                  onChange={(e) => setMaxFiles(e.target.value)}
                  placeholder="1"
                  min="1"
                  className="bg-background border-input text-foreground"
                />
              </div>
            </div>
          </div>
          
          <div>
            <Label className="text-foreground mb-2 block text-sm">Allowed File Types</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {fileTypes.map(type => (
                <div 
                  key={type} 
                  className="bg-background px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                >
                  <FileType className="h-3 w-3 text-muted-foreground" />
                  <span className="text-foreground">.{type}</span>
                  <button
                    type="button"
                    onClick={() => removeFileType(type)}
                    className="text-red-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={fileTypeInput}
                onChange={(e) => setFileTypeInput(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                placeholder="Enter file extension (e.g. pdf)"
                className="bg-background border-input text-foreground"
              />
              <Button
                type="button"
                onClick={addFileType}
                className="bg-background hover:bg-input text-foreground"
                disabled={!fileTypeInput}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-foreground text-sm">Grading Rubric</Label>
              <Button
                type="button"
                onClick={addRubricItem}
                className="bg-background hover:bg-input text-foreground"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Criterion
              </Button>
            </div>
            
            {rubric.length === 0 ? (
              <div className="bg-background p-6 rounded-md text-center">
                <p className="text-foreground mb-4">No rubric items added yet</p>
                <Button
                  type="button"
                  onClick={addRubricItem}
                  className="bg-background hover:bg-input text-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Grading Criterion
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {rubric.map((item) => (
                  <Card key={item.id} className="bg-background border-input">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Input
                            value={item.criterion}
                            onChange={(e) => updateRubricItemField(item.id, 'criterion', e.target.value)}
                            placeholder="Criterion name (e.g., Code Quality)"
                            className="mb-2 bg-background border-input text-foreground"
                          />
                          <div className="flex items-center gap-2">
                            <Label className="text-foreground">Points:</Label>
                            <Input
                              type="number"
                              value={item.points}
                              onChange={(e) => updateRubricItemField(item.id, 'points', parseInt(e.target.value))}
                              className="w-24 bg-background border-input text-foreground"
                              min="1"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeRubricItem(item.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-transparent h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <Label className="text-foreground mb-2 block text-sm">Description</Label>
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateRubricItemField(item.id, 'description', e.target.value)}
                        placeholder="Describe what you're looking for in this criterion"
                        className="h-20 bg-background border-input text-foreground"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2 pt-4">
            <Checkbox
              id="previewable"
              checked={previewable}
              onCheckedChange={(checked) => setPreviewable(!!checked)}
              className="data-[state=checked]:bg-primary"
            />
            <Label
              htmlFor="previewable"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground"
            >
              Available in free preview
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="bg-transparent border-input text-foreground hover:bg-background"
          >
            Cancel
          </Button>
          
          <FeatureCheck
            route={`/api/courses/lessons/${lessonId}`}
            fallback={
              <FeatureUnavailableMessage
                title="Assignment Editor Feature"
                description="The assignment editor feature is still under development. Check back soon!"
                type="coming-soon"
                action={
                  <Button
                    type="button"
                    onClick={onCancel}
                    className="bg-background hover:bg-input text-foreground"
                  >
                    Go Back
                  </Button>
                }
              />
            }
          >
            <Button
              type="submit"
              disabled={loading}
              className="bg-background hover:bg-input text-foreground"
            >
              {loading ? 'Saving...' : <><Save className="h-4 w-4 mr-2" /> Save Assignment</>}
            </Button>
          </FeatureCheck>
        </CardFooter>
      </form>
    </Card>
  )
} 