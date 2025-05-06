import React from 'react'
import { getNotifications, onAuthenticateUser } from '@/actions/user'
import {
  getAllUserVideos,
  getWorkspaceFolders,
  getWorkSpaces,
  verifyAccessToWorkspace,
} from '@/actions/workspace'
import { redirect } from 'next/navigation'
import { Toaster } from '@/components/ui/toaster'
import ClientWorkspaceLayout from './client-workspace-layout'
import EnhancedLayout from './enhanced-layout'
import { cookies } from 'next/headers'

// This is a special interface for the workspaceId segment
interface WorkspaceParams {
  workspaceId: string;
}

// Create a layout wrapper using a simpler interface - this remains a server component
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: WorkspaceParams;
}) {
  // Safely extract workspaceId parameter
  const { workspaceId } = params || { workspaceId: "" };
  
  // If no workspaceId is provided, show a basic layout
  if (!workspaceId) {
    return (
      <div className="p-4">
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <h2 className="text-amber-800 font-medium">Invalid Workspace</h2>
          <p className="text-amber-700 text-sm">
            No workspace ID was provided. Please try a different workspace.
          </p>
        </div>
      </div>
    );
  }
  
  try {
    // Check if resilient auth mode is enabled
    const cookieStore = cookies()
    const authMode = cookieStore.get('auth_mode')?.value
    
    // If resilient auth is enabled, use the enhanced layout
    if (authMode === 'resilient') {
      return <EnhancedLayout params={params}>{children}</EnhancedLayout>
    }
    
    // Standard auth flow below - original implementation
    try {
      // Authenticate user from server side
      const auth = await onAuthenticateUser()
      
      // Handle authentication errors with explicit fallbacks
      if (!auth || !auth.user) {
        return redirect('/auth/sign-in');
      }
      
      if (!auth.user.workspace || !auth.user.workspace.length) {
        return redirect('/auth/sign-in');
      }
      
      try {
        // Verify workspace access
        const hasAccess = await verifyAccessToWorkspace(workspaceId)
        
        if (hasAccess.status !== 200) {
          return redirect(`/dashboard/${auth.user?.workspace[0].id}`);
        }
        
        if (!hasAccess.data?.workspace) {
          return (
            <div className="p-4">
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <h2 className="text-amber-800 font-medium">Workspace Not Found</h2>
                <p className="text-amber-700 text-sm">
                  The workspace you're trying to access doesn't exist or you don't have permission to view it.
                </p>
              </div>
            </div>
          );
        }
        
        // Safely prefetch data with error handling
        let workspacesData: any = null;
        let notificationsData: any = null;
        
        try {
          workspacesData = await getWorkSpaces();
        } catch (error) {
          console.error("Failed to fetch workspaces:", error);
          workspacesData = { status: 200, data: [] };
        }
        
        try {
          notificationsData = await getNotifications();
        } catch (error) {
          console.error("Failed to fetch notifications:", error);
          notificationsData = { status: 200, data: [] };
        }
        
        // Pass prefetched data and workspace access data to client component
        return (
          <ClientWorkspaceLayout 
            workspaceId={workspaceId}
            workspace={hasAccess.data.workspace}
            initialWorkspaces={workspacesData}
            initialNotifications={notificationsData}
          >
            {children}
          </ClientWorkspaceLayout>
        );
      } catch (accessError) {
        console.error("Error verifying workspace access:", accessError);
        // Fall back to enhanced layout as a last resort
        return <EnhancedLayout params={params}>{children}</EnhancedLayout>
      }
    } catch (authError) {
      console.error("Authentication error:", authError);
      // Fall back to enhanced layout in case of auth errors
      return <EnhancedLayout params={params}>{children}</EnhancedLayout>
    }
  } catch (error) {
    // Last resort fallback if everything fails
    console.error("Fatal error in workspace layout:", error);
    
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h2 className="text-red-800 font-medium">Critical Error</h2>
          <p className="text-red-700 text-sm">
            We encountered a critical error while loading your workspace.
            Please try again later or contact support.
          </p>
        </div>
        <div className="mt-4 p-4 bg-white rounded-md shadow">
          {children}
        </div>
      </div>
    );
  }
}
