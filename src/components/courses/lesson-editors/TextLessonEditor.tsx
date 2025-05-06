'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Save } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { FeatureCheck } from '@/components/ui/feature-check'
import { FeatureUnavailableMessage } from '@/components/ui/feature-unavailable-message'
import { cn } from '@/lib/utils'

// Import rich text editor with dynamic import to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'

interface TextLessonEditorProps {
  lessonId: string
  courseId: string
  initialData?: {
    title: string
    description?: string
    content?: string
    previewable: boolean
  }
  onSave: () => void
  onCancel: () => void
}

export default function TextLessonEditor({
  lessonId,
  courseId,
  initialData,
  onSave,
  onCancel
}: TextLessonEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [previewable, setPreviewable] = useState(initialData?.previewable || false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    
    if (!content.trim()) {
      toast.error('Content is required')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await axios.patch(`/api/courses/lessons/${lessonId}`, {
        title,
        description,
        content,
        previewable
      })
      
      if (response.data.status === 200) {
        toast.success('Text lesson updated successfully')
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
    <Card className="bg-card border-border elevation-3 animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <FileText className="h-5 w-5 text-primary" />
          Edit Text Lesson
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-foreground mb-2 block">Lesson Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter lesson title"
              className="bg-background border-border text-foreground"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description" className="text-foreground mb-2 block">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this lesson"
              className="h-20 bg-background border-border text-foreground"
            />
          </div>
          
          <div>
            <Label htmlFor="content" className="text-foreground mb-2 block">Lesson Content</Label>
            <div className="bg-background rounded-md border border-border">
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                placeholder="Write your lesson content here..."
                className="min-h-[300px]"
              />
            </div>
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
            className="bg-background border-border text-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          
          <FeatureCheck
            route={`/api/courses/lessons/${lessonId}`}
            fallback={
              <FeatureUnavailableMessage
                title="Text Lesson Editor"
                description="The text lesson editor feature is still under development. Check back soon!"
                type="coming-soon"
                action={
                  <Button
                    type="button"
                    onClick={onCancel}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? 'Saving...' : <><Save className="h-4 w-4 mr-2" /> Save Text Lesson</>}
            </Button>
          </FeatureCheck>
        </CardFooter>
      </form>
    </Card>
  )
} 