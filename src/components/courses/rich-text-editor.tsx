'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote,
  Link, Image, Code, Undo, Redo
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing your lesson content...',
  disabled = false
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string>('editor');
  const [plainHtml, setPlainHtml] = useState<string>(value || '');
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  
  // Log initial props for debugging
  useEffect(() => {
    console.log('[RICH_TEXT_EDITOR] Initialized with:', { 
      valueLength: value?.length, 
      disabled, 
      hasEditorRef: !!editorRef.current 
    });
  }, []);
  
  // Initialize the editor content when component mounts
  useEffect(() => {
    if (editorRef.current && value) {
      editorRef.current.innerHTML = value;
      console.log('[RICH_TEXT_EDITOR] Initial content set:', { contentLength: value.length });
    }
  }, [value]);
  
  // Preserve cursor position after content updates
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && cursorPosition !== null) {
      try {
        // Attempt to restore the selection
        const selection = window.getSelection();
        const range = document.createRange();
        
        // Find the correct text node and position
        let currentNode = editor;
        let currentPos = 0;
        let targetNode = null;
        let targetOffset = 0;
        
        // Function to traverse DOM and find the node containing our position
        const findPosition = (node: Node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const textLength = node.textContent?.length || 0;
            if (currentPos <= cursorPosition && currentPos + textLength >= cursorPosition) {
              targetNode = node;
              targetOffset = cursorPosition - currentPos;
              return true;
            }
            currentPos += textLength;
          } else {
            for (let i = 0; i < node.childNodes.length; i++) {
              if (findPosition(node.childNodes[i])) {
                return true;
              }
            }
          }
          return false;
        };
        
        findPosition(editor);
        
        if (targetNode) {
          range.setStart(targetNode, targetOffset);
          range.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(range);
          console.log('[RICH_TEXT_EDITOR] Restored cursor to position:', cursorPosition);
        }
      } catch (e) {
        console.error('[RICH_TEXT_EDITOR] Error restoring cursor:', e);
      }
    }
  }, [cursorPosition]);
  
  const saveCursorPosition = () => {
    if (disabled) return;
    try {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Function to calculate the absolute position
        const getAbsolutePosition = (node: Node, offset: number): number => {
          let position = 0;
          
          if (node.nodeType === Node.TEXT_NODE) {
            position = offset;
          } else if (offset > 0) {
            // If we're inside an element at position > 0, we need to count content before this point
            for (let i = 0; i < offset; i++) {
              position += node.childNodes[i].textContent?.length || 0;
            }
          }
          
          // Add length of all previous sibling nodes
          let sibling = node.previousSibling;
          while (sibling) {
            position += sibling.textContent?.length || 0;
            sibling = sibling.previousSibling;
          }
          
          // If we're inside a child node, we need to add parent offset
          if (node.parentNode && node.parentNode !== editorRef.current) {
            position += getAbsolutePosition(node.parentNode, 
              Array.from(node.parentNode.childNodes).indexOf(node as ChildNode));
          }
          
          return position;
        };
        
        const absolutePosition = getAbsolutePosition(range.startContainer, range.startOffset);
        setCursorPosition(absolutePosition);
        console.log('[RICH_TEXT_EDITOR] Saved cursor position:', absolutePosition);
      }
    } catch (e) {
      console.error('[RICH_TEXT_EDITOR] Error saving cursor position:', e);
    }
  };
  
  const execCommand = (command: string, value: string = '') => {
    if (disabled) return;
    
    // Save cursor position before executing command
    saveCursorPosition();
    
    document.execCommand(command, false, value);
    const content = editorRef.current?.innerHTML || '';
    onChange(content);
    setPlainHtml(content);
    
    console.log('[RICH_TEXT_EDITOR] Executed command:', command, { 
      contentLength: content.length,
      cursorPos: cursorPosition 
    });
  };
  
  const onInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    // Save cursor position
    saveCursorPosition();
    
    const content = e.currentTarget.innerHTML;
    onChange(content);
    setPlainHtml(content);
    
    console.log('[RICH_TEXT_EDITOR] Content updated on input:', { 
      contentLength: content.length,
      cursorPos: cursorPosition
    });
  };
  
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    // Process after keydown but before default behavior
    setTimeout(() => {
      saveCursorPosition();
    }, 0);
    
    console.log('[RICH_TEXT_EDITOR] Key pressed:', e.key);
  };
  
  const onBlur = () => {
    // Save the cursor position when the editor loses focus
    saveCursorPosition();
  };
  
  const onFocus = () => {
    // Restore cursor position if available
    if (cursorPosition !== null) {
      console.log('[RICH_TEXT_EDITOR] Focusing, will restore cursor to:', cursorPosition);
    }
  };
  
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    if (newTab === 'html') {
      setPlainHtml(editorRef.current?.innerHTML || '');
    } else if (newTab === 'editor') {
      if (editorRef.current) {
        editorRef.current.innerHTML = plainHtml;
      }
    }
    
    console.log('[RICH_TEXT_EDITOR] Tab changed to:', newTab);
  };
  
  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPlainHtml(e.target.value);
    onChange(e.target.value);
    
    console.log('[RICH_TEXT_EDITOR] HTML content updated:', { 
      contentLength: e.target.value.length 
    });
  };
  
  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };
  
  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };
  
  const toolbar = [
    [
      { icon: Bold, action: () => execCommand('bold'), title: 'Bold' },
      { icon: Italic, action: () => execCommand('italic'), title: 'Italic' },
      { icon: Underline, action: () => execCommand('underline'), title: 'Underline' },
    ],
    [
      { icon: AlignLeft, action: () => execCommand('justifyLeft'), title: 'Align Left' },
      { icon: AlignCenter, action: () => execCommand('justifyCenter'), title: 'Align Center' },
      { icon: AlignRight, action: () => execCommand('justifyRight'), title: 'Align Right' },
    ],
    [
      { icon: Heading1, action: () => execCommand('formatBlock', '<h1>'), title: 'Heading 1' },
      { icon: Heading2, action: () => execCommand('formatBlock', '<h2>'), title: 'Heading 2' },
      { icon: Heading3, action: () => execCommand('formatBlock', '<h3>'), title: 'Heading 3' },
    ],
    [
      { icon: List, action: () => execCommand('insertUnorderedList'), title: 'Bullet List' },
      { icon: ListOrdered, action: () => execCommand('insertOrderedList'), title: 'Numbered List' },
      { icon: Quote, action: () => execCommand('formatBlock', '<blockquote>'), title: 'Quote' },
    ],
    [
      { icon: Link, action: insertLink, title: 'Insert Link' },
      { icon: Image, action: insertImage, title: 'Insert Image' },
      { icon: Code, action: () => execCommand('formatBlock', '<pre>'), title: 'Code Block' },
    ],
    [
      { icon: Undo, action: () => execCommand('undo'), title: 'Undo' },
      { icon: Redo, action: () => execCommand('redo'), title: 'Redo' },
    ],
  ];

  return (
    <div className="w-full border border-border rounded-md overflow-hidden bg-card">
      <Tabs defaultValue="editor" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="bg-background/80 border-b border-border">
          <TabsTrigger value="editor" className="text-muted-foreground">Visual Editor</TabsTrigger>
          <TabsTrigger value="html" className="text-muted-foreground">HTML Code</TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor" className="p-0 m-0">
          <div className="flex flex-wrap gap-1 p-2 bg-background border-b border-border">
            {toolbar.map((group, groupIndex) => (
              <React.Fragment key={groupIndex}>
                <div className="flex gap-1">
                  {group.map((item, itemIndex) => (
                    <Toggle
                      key={itemIndex}
                      pressed={false}
                      onPressedChange={() => item.action()}
                      disabled={disabled}
                      title={item.title}
                      className="h-8 w-8 p-0 data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground"
                    >
                      <item.icon className="h-4 w-4" />
                    </Toggle>
                  ))}
                </div>
                {groupIndex < toolbar.length - 1 && (
                  <Separator orientation="vertical" className="h-8 mx-1" />
                )}
              </React.Fragment>
            ))}
          </div>
          
          <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={onInput}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            onFocus={onFocus}
            className={cn(
              "min-h-[300px] p-4 focus:outline-none bg-background text-foreground",
              "prose prose-stone max-w-none",
              "prose-headings:text-foreground prose-a:text-primary",
              !value && "before:content-[attr(data-placeholder)] before:text-muted-foreground"
            )}
            dangerouslySetInnerHTML={{ __html: value }}
            data-placeholder={placeholder}
          />
        </TabsContent>
        
        <TabsContent value="html" className="p-0 m-0">
          <textarea
            value={plainHtml}
            onChange={handleHtmlChange}
            disabled={disabled}
            className="w-full min-h-[380px] p-4 bg-background text-foreground/90 font-mono text-sm resize-y focus:outline-none border-none"
            placeholder="Enter HTML..."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 