'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, MessageSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import axios from 'axios'

interface RatingProps {
  type: 'summary' | 'tutor' | 'lesson'
  itemId: string
  className?: string
  onFeedbackComplete?: () => void
}

export default function Rating({
  type,
  itemId,
  className,
  onFeedbackComplete
}: RatingProps) {
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null)
  const [showComment, setShowComment] = useState(false)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const handleRating = async (value: 'positive' | 'negative') => {
    setRating(value)
    
    try {
      setIsSubmitting(true)
      
      await axios.post('/api/feedback', {
        type,
        itemId,
        rating: value
      })
      
      if (!showComment) {
        setIsComplete(true)
        if (onFeedbackComplete) onFeedbackComplete()
        toast.success('Thank you for your feedback!')
      }
    } catch (error) {
      toast.error('Failed to submit feedback')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCommentSubmit = async () => {
    if (!rating) return
    
    try {
      setIsSubmitting(true)
      
      await axios.post('/api/feedback', {
        type,
        itemId,
        rating,
        comment: comment.trim()
      })
      
      setIsComplete(true)
      if (onFeedbackComplete) onFeedbackComplete()
      toast.success('Thank you for your detailed feedback!')
    } catch (error) {
      toast.error('Failed to submit feedback')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (isComplete) {
    return (
      <div className={cn(
        "flex items-center justify-center py-2 px-4 text-sm text-[#9D9D9D] bg-[#111111] rounded-md",
        className
      )}>
        <span>Thanks for your feedback!</span>
      </div>
    )
  }
  
  return (
    <div className={cn(
      "p-3 rounded-md border border-[#2A2A2A] bg-[#111111]",
      className
    )}>
      {!showComment ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#9D9D9D]">Was this helpful?</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-full p-2 hover:bg-[#2A2A2A]",
                rating === 'positive' && "bg-green-900/20 text-green-500 hover:bg-green-900/30 hover:text-green-400"
              )}
              onClick={() => handleRating('positive')}
              disabled={isSubmitting}
            >
              <ThumbsUp size={16} />
              <span className="sr-only">Yes</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-full p-2 hover:bg-[#2A2A2A]",
                rating === 'negative' && "bg-red-900/20 text-red-500 hover:bg-red-900/30 hover:text-red-400"
              )}
              onClick={() => handleRating('negative')}
              disabled={isSubmitting}
            >
              <ThumbsDown size={16} />
              <span className="sr-only">No</span>
            </Button>
            
            {rating && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full p-2 hover:bg-[#2A2A2A] text-[#9D9D9D]"
                onClick={() => setShowComment(true)}
                disabled={isSubmitting}
              >
                <MessageSquare size={16} />
                <span className="sr-only">Add Comment</span>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#9D9D9D]">Add a comment</span>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full p-1 hover:bg-[#2A2A2A] h-6 w-6"
              onClick={() => setShowComment(false)}
            >
              <X size={14} />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          
          <Textarea
            placeholder="Your feedback helps us improve..."
            className="bg-[#1A1A1A] border-[#3A3A3A] text-white resize-none h-24"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isSubmitting}
          />
          
          <div className="flex justify-end">
            <Button
              variant="default"
              size="sm"
              className="bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white"
              onClick={handleCommentSubmit}
              disabled={isSubmitting || !comment.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 