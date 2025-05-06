'use client'

import { TabsContent } from '../../../components/ui/tabs'
import { Button } from '../../../components/ui/button'
import React, { useState } from 'react'
import { SparklesIcon } from 'lucide-react'
import { generateVideoSummary } from '../../../actions/workspace'

type Props = {
  description: string | null
  videoId: string
  isProUser: boolean
}

const VideoSummary = ({ description, videoId, isProUser }: Props) => {
  const [loading, setLoading] = useState(false)
  const [summaryContent, setSummaryContent] = useState<string | null>(null)
  
  // Try to extract the educational summary from the description
  React.useEffect(() => {
    if (description) {
      try {
        const parsedData = JSON.parse(description)
        if (parsedData.educationalSummary || parsedData.aiSummary) {
          const summary = parsedData.educationalSummary || parsedData.aiSummary
          setSummaryContent(summary)
        }
      } catch (e) {
        // Not a JSON string or no summary available
        setSummaryContent(null)
      }
    }
  }, [description])
  
  const handleGenerateSummary = async () => {
    setLoading(true)
    try {
      const result = await generateVideoSummary(videoId)
      if (result.status === 200 && result.data && result.data.summary) {
        setSummaryContent(result.data.summary)
      }
    } catch (error) {
      console.error("Failed to generate summary:", error)
    } finally {
      setLoading(false)
    }
  }

  // Function to render markdown-like content
  const renderFormattedContent = (content: string) => {
    // Replace markdown-style headers with styled elements
    const withHeaders = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Split by bullet points or newlines
    const lines = withHeaders.split(/\n|•/).filter(line => line.trim().length > 0);
    
    return (
      <div className="space-y-4">
        {lines.map((line, index) => {
          const trimmedLine = line.trim();
          
          // Check if this is a header line (contains a colon at the end)
          if (trimmedLine.includes('**') && trimmedLine.includes(':')) {
            return (
              <div key={index} className="mt-4">
                <h4 className="text-white text-lg font-medium" 
                    dangerouslySetInnerHTML={{ __html: trimmedLine }} />
              </div>
            );
          } 
          // Handle bullet points
          else if (trimmedLine.startsWith('*')) {
            return (
              <li key={index} className="ml-5 text-[#a7a7a7]"
                  dangerouslySetInnerHTML={{ __html: trimmedLine.substring(1).trim() }} />
            );
          }
          // Regular paragraph
          else {
            return (
              <p key={index} className="text-[#a7a7a7]" 
                 dangerouslySetInnerHTML={{ __html: trimmedLine }} />
            );
          }
        })}
      </div>
    );
  };

  return (
    <TabsContent
      value="Summary"
      className="rounded-xl flex flex-col gap-y-6"
    >
      {summaryContent ? (
        <div className="space-y-4">
          <h3 className="text-xl font-medium text-white mb-4">Educational Summary</h3>
          <div className="h-[calc(56.25vw*0.66)] max-h-[480px] overflow-y-auto pr-4 custom-scrollbar">
            {renderFormattedContent(summaryContent)}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 space-y-4 h-[calc(56.25vw*0.66)] max-h-[480px]">
          <p className="text-[#a7a7a7] text-center">
            {isProUser 
              ? "No educational summary available for this video yet." 
              : "Educational summaries are available only for PRO users."}
          </p>
          {isProUser && (
            <Button 
              onClick={handleGenerateSummary} 
              disabled={loading}
              className="bg-secondary hover:bg-secondary/90 text-white flex items-center gap-2"
            >
              <SparklesIcon size={16} />
              {loading ? "Generating..." : "Generate Summary"}
            </Button>
          )}
        </div>
      )}
    </TabsContent>
  )
}

export default VideoSummary 