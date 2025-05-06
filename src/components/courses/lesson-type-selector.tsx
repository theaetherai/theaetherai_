'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Video, 
  FileText, 
  FileQuestion, 
  ClipboardEdit, 
  CheckCircle
} from 'lucide-react';

interface LessonTypeSelectorProps {
  value: 'video' | 'text' | 'quiz' | 'assignment';
  onChange: (value: 'video' | 'text' | 'quiz' | 'assignment') => void;
  disabled?: boolean;
}

export default function LessonTypeSelector({
  value,
  onChange,
  disabled = false
}: LessonTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full">
      {[
        { 
          value: 'video', 
          label: 'Video', 
          icon: Video,
          description: 'Upload or select video lessons'
        },
        { 
          value: 'text', 
          label: 'Text', 
          icon: FileText,
          description: 'Create rich text content'
        },
        { 
          value: 'quiz', 
          label: 'Quiz', 
          icon: FileQuestion,
          description: 'Test knowledge with questions'
        },
        { 
          value: 'assignment', 
          label: 'Assignment', 
          icon: ClipboardEdit,
          description: 'Create tasks for submission'
        },
      ].map((type) => (
        <button
          key={type.value}
          onClick={() => onChange(type.value as any)}
          disabled={disabled}
          className={cn(
            "flex flex-col items-center justify-center p-6 rounded-xl border transition-all",
            "hover:bg-secondary/20 hover:border-primary/40 hover:shadow-md relative overflow-hidden group",
            value === type.value 
              ? "bg-secondary/30 border-primary shadow-md" 
              : "bg-background border-border/60",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div 
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity",
              value === type.value ? "from-primary/10 to-transparent opacity-100" : "",
              "group-hover:opacity-50"
            )} 
          />
          
          <div className="relative z-10 space-y-3">
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center mx-auto",
              "bg-background/80 group-hover:bg-background",
              value === type.value ? "bg-primary/10" : ""
            )}>
              <type.icon className={cn(
                "h-7 w-7",
                value === type.value ? "text-primary" : "text-foreground/80"
              )} />
              
              {value === type.value && (
                <div className="absolute -right-1 -top-1 bg-primary rounded-full p-1 shadow-sm">
                  <CheckCircle className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
            
            <div>
              <h3 className={cn(
                "font-medium text-center",
                value === type.value ? "text-primary" : "text-foreground"
              )}>
                {type.label}
              </h3>
              
              <p className="text-xs text-muted-foreground text-center mt-1 px-2">
                {type.description}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
} 