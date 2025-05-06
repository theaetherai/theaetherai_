import { getNotifications } from '@/actions/user'
import {
  getAllUserVideos,
  getWorkspaceFolders,
  getWorkSpaces,
} from '@/actions/workspace'
import CreateForlders from '@/components/global/create-folders'
import CreateWorkspace from '@/components/global/create-workspace'
import Folders from '@/components/global/folders'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RefreshCcw, UploadCloud } from 'lucide-react'
import RecordButtonContainer from '@/components/global/record-button'

// This is a special interface for the workspaceId segment
interface WorkspaceParams {
  workspaceId: string;
}

// Resilient page wrapper that handles errors
export default async function Page({
  params,
}: {
  params: WorkspaceParams;
}) {
  try {
    // Get workspaceId from params
    const { workspaceId } = params;
    
    // Create new query client
    const query = new QueryClient()

    // Safely wrap prefetch operations with try-catch
    try {
      // Prefetch data on the server
      await query.prefetchQuery({
        queryKey: ['workspace-folders'],
        queryFn: () => getWorkspaceFolders(workspaceId),
      })

      await query.prefetchQuery({
        queryKey: ['user-videos'],
        queryFn: () => getAllUserVideos(workspaceId),
      })
    } catch (error) {
      console.error("Failed to prefetch data:", error);
      // Continue even if prefetch fails - we'll handle it in the UI
    }

    // Render the dashboard content
    return (
      <HydrationBoundary state={dehydrate(query)}>
        <div>
          <Tabs
            defaultValue="videos"
            className="mt-6"
          >
            <div className="flex w-full justify-between items-center">
              <TabsList className="bg-transparent gap-2 pl-0">
                <TabsTrigger
                  className="p-[13px] px-6 rounded-full data-[state=active]:bg-[#252525]"
                  value="videos"
                >
                  Videos
                </TabsTrigger>
                <TabsTrigger
                  value="archive"
                  className="p-[13px] px-6 rounded-full data-[state=active]:bg-[#252525]"
                >
                  Archive
                </TabsTrigger>
              </TabsList>
              <div className="flex gap-x-3">
                <RecordButtonContainer workspaceId={workspaceId} />
                <Link href={`/dashboard/${workspaceId}/enhanced-upload`}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <UploadCloud size={16} />
                    Enhanced Upload
                  </Button>
                </Link>
                <Link href={`/dashboard/${workspaceId}/cloudinary-upload`}>
                  <Button variant="outline" className="flex items-center gap-2 bg-blue-50 border-blue-200 hover:bg-blue-100">
                    <UploadCloud size={16} className="text-blue-500" />
                    Cloudinary Upload
                  </Button>
                </Link>
                <CreateWorkspace />
                <CreateForlders workspaceId={workspaceId} />
              </div>
            </div>
            <section className="py-9">
              <TabsContent value="videos">
                <Folders workspaceId={workspaceId} />
              </TabsContent>
            </section>
          </Tabs>
        </div>
      </HydrationBoundary>
    )
  } catch (error) {
    // Fallback UI if anything fails
    console.error("Dashboard page error:", error);
    return (
      <div className="p-4">
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            We couldn't load your dashboard. You can try refreshing the page.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-8">
          <button 
            onClick={() => window.location.reload()} 
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            <RefreshCcw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>
    )
  }
}
