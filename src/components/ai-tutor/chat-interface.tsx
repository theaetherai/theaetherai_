'use client'

import React, { useState, useRef, useEffect } from 'react'
import { SendIcon, Loader2, ArrowLeft, ExternalLink } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { ScrollArea } from '../../components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Card } from '../../components/ui/card'
import { toast } from 'sonner'
import axios from 'axios'
import Link from 'next/link'
import { cn } from '../../lib/utils'

type Message = {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface ChatInterfaceProps {
  videoId?: string
  videoTitle?: string
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ videoId, videoTitle }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Add initial greeting message
  useEffect(() => {
    const initialMessage = {
      id: Date.now().toString(),
      content: videoId 
        ? `Hi there! I'm your AI tutor. How can I help you understand the video "${videoTitle}"?` 
        : "Hi there! I'm your AI tutor. How can I help you today?",
      role: 'assistant' as const,
      timestamp: new Date()
    }
    setMessages([initialMessage])
  }, [videoId, videoTitle])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim()) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    
    try {
      const response = await axios.post('/api/ai/tutor', {
        question: input,
        videoId
      })
      
      if (response.data.status === 200) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.data.answer,
          role: 'assistant',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(response.data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to get a response', {
        description: 'Please try again later.'
      })
    } finally {
      setLoading(false)
      // Focus the input field after sending
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }

  return (
    <div className="flex flex-col h-[80vh] bg-background rounded-lg overflow-hidden border-2 border-border/50 hover:border-border/70 transition-colors shadow-md elevation-3 elevation-transition">
      {/* Video context if available */}
      {videoTitle && (
        <div className="px-4 py-3 bg-secondary/30 border-b border-border/60">
          <p className="text-sm text-muted-foreground">
            Discussing: <span className="text-foreground font-medium">{videoTitle}</span>
          </p>
        </div>
      )}
      
      {/* Message area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 animate-fade-in">
          {messages.map((message, index) => (
            <div 
              key={message.id} 
              className={cn(
                `flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`,
                `delay-${(index % 5) + 1}`
              )}
            >
              <div className="flex items-start gap-3 max-w-[85%]">
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 m-1 border border-primary/50">
                    <AvatarImage src="/aether-logo.svg" alt="AI" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                
                <Card className={cn(
                  "p-3 rounded-xl", 
                  message.role === 'user' 
                    ? 'bg-secondary/50 text-foreground border-2 border-border/70 elevation-1' 
                    : 'bg-primary/10 text-foreground border-2 border-primary/30 elevation-2'
                )}>
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                </Card>
                
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 shrink-0 border border-border/60 elevation-1">
                    <AvatarFallback className="bg-muted-foreground text-white">You</AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex items-start gap-3 max-w-[85%]">
                <Avatar className="h-8 w-8 m-1 border border-primary/50">
                  <AvatarImage src="/aether-logo.svg" alt="AI" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <Card className="p-3 rounded-xl bg-primary/10 text-foreground border-2 border-primary/30 elevation-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </Card>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Input area */}
      <div className="p-4 border-t border-border/60 bg-background">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 bg-background border-2 border-border/60 hover:border-border/80 focus:border-primary/40 text-foreground focus-visible:ring-primary rounded-lg"
            disabled={loading}
          />
          <Button 
            type="submit" 
            disabled={loading || !input.trim()} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/30 elevation-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        {videoId && (
          <div className="mt-4 flex justify-center">
            <Link href={`/preview/${videoId}`}>
              <Button variant="outline" className="flex items-center gap-2 bg-background hover:bg-secondary border-2 border-border/60 hover:border-border/80 text-foreground elevation-1 transition-all">
                <ArrowLeft size={16} />
                <span>Return to Video</span>
                <ExternalLink size={14} className="ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatInterface 