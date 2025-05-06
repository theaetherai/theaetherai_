'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Save, Video } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import { FeatureCheck } from '@/components/ui/feature-check'
import { FeatureUnavailableMessage } from '@/components/ui/feature-unavailable-message'
import { useRouteAvailability } from '@/hooks/useRouteAvailability'
import { cn } from '@/lib/utils'

interface VideoLessonEditorProps {
  lessonId: string
  courseId: string
  initialData?: {
    title: string
    description?: string | null
    videoId?: string | null
    duration?: number | null
    previewable: boolean
  }
  onSave: () => void
  onCancel: () => void
}

export default function VideoLessonEditor({
  lessonId,
  courseId,
  initialData,
  onSave,
  onCancel
}: VideoLessonEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [videoId, setVideoId] = useState(initialData?.videoId || '')
  const [duration, setDuration] = useState(initialData?.duration?.toString() || '')
  const [previewable, setPreviewable] = useState(initialData?.previewable || false)
  const [loading, setLoading] = useState(false)
  const [videos, setVideos] = useState<any[]>([])
  const [loadingVideos, setLoadingVideos] = useState(true)
  const { checkRouteExists } = useRouteAvailability()
  
  // Check if video preview is available
  const [videoPreviewAvailable, setVideoPreviewAvailable] = useState<boolean | null>(null)
  
  useEffect(() => {
    // Check if the video preview API exists
    checkRouteExists('/api/videos/preview').then(exists => {
      setVideoPreviewAvailable(exists)
    })
    
    // Fetch available videos for selection
    const fetchVideos = async () => {
      try {
        setLoadingVideos(true)
        const response = await axios.get('/api/videos')
        
        if (response.data.status === 200) {
          setVideos(response.data.data || [])
        } else {
          toast.error('Failed to load videos')
        }
      } catch (error) {
        console.error('Error fetching videos:', error)
        toast.error('Error loading videos')
      } finally {
        setLoadingVideos(false)
      }
    }
    
    fetchVideos()
  }, [checkRouteExists])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    
    if (!videoId) {
      toast.error('Please select a video')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await axios.patch(`/api/courses/lessons/${lessonId}`, {
        title,
        description,
        videoId,
        duration: duration ? parseInt(duration) : undefined,
        previewable
      })
      
      if (response.data.status === 200) {
        toast.success('Video lesson updated successfully')
        onSave()
      }
    } catch (error) {
      console.error('Failed to update lesson', error)
      toast.error('Failed to update lesson')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-card border-border elevation-3 animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Video className="h-5 w-5 text-primary" />
          Edit Video Lesson
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
            <Label htmlFor="video" className="text-foreground mb-2 block">Select Video</Label>
            <Select
              value={videoId}
              onValueChange={setVideoId}
            >
              <SelectTrigger id="video" className="bg-background border-border text-foreground">
                <SelectValue placeholder="Select a video" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground max-h-[200px]">
                {loadingVideos ? (
                  <div className="p-2 text-center">Loading videos...</div>
                ) : videos.length > 0 ? (
                  videos.map(video => (
                    <SelectItem key={video.id} value={video.id}>
                      {video.title || 'Untitled Video'}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-center">
                    No videos available. Upload videos in your workspace first.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="duration" className="text-foreground mb-2 block">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Video duration in minutes"
              className="bg-background border-border text-foreground"
              min="1"
            />
          </div>
          
          <div className="flex items-center space-x-2 mt-4">
            <Checkbox 
              id="previewable" 
              checked={previewable}
              onCheckedChange={(checked) => setPreviewable(checked as boolean)}
              className="bg-background border-border"
            />
            <label
              htmlFor="previewable"
              className="text-sm text-foreground font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Available in free preview
            </label>
          </div>
          
          <div className="mt-6">
            <Label className="text-foreground mb-2 block">Video Preview</Label>
            <FeatureCheck
              route="/api/videos/preview"
              fallback={
                <FeatureUnavailableMessage 
                  title="Video Preview Not Available"
                  description="The video preview feature is not yet implemented. Students will still be able to view the video in the course."
                  type="info"
                />
              }
            >
              {videoId ? (
                <div className="rounded-md overflow-hidden bg-black aspect-video">
                  <iframe
                    src={`/preview/${videoId}`}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="rounded-md bg-background flex items-center justify-center aspect-video text-muted-foreground">
                  Select a video to preview
                </div>
              )}
            </FeatureCheck>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={loading}
            className="bg-background border-border text-foreground hover:bg-border"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? 'Saving...' : 'Save Video Lesson'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 