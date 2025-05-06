import React from 'react'
import { getNotifications } from '@/actions/user'
import { getWorkSpaces, verifyAccessToWorkspace } from '@/actions/workspace'
import ClientWorkspaceLayout from './client-workspace-layout'
import { logAuthError } from '@/lib/auth-resilience'
import { SocketProvider } from '@/components/global/socket-provider'

// Interface for the workspaceId parameter
interface WorkspaceParams {
  workspaceId: string;
}

// Define a simplified function that acts as a fallback for user authentication
const getFallbackAuth = async () => {
  return {
    status: 200,
    user: {
      id: 'fallback-user',
      workspace: [
        {
          id: 'fallback-workspace',
          name: 'Fallback Workspace',
          type: 'PERSONAL'
        }
      ]
    }
  }
}

// Create enhanced layout component
export default async function EnhancedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: WorkspaceParams;
}) {
  // Get workspaceId with await to ensure it's loaded properly
  const { workspaceId } = params;
  
  // Track if we're using fallback mode
  let usingFallback = false;
  
  try {
    // Attempt to get workspaces
    const workspaces = await getWorkSpaces();
    const notifications = await getNotifications();
    
    // Try to verify workspace access
    let workspaceData;
    try {
      const hasAccess = await verifyAccessToWorkspace(workspaceId);
      if (hasAccess.status === 200 && hasAccess.data?.workspace) {
        workspaceData = hasAccess.data.workspace;
      } else {
        usingFallback = true;
        // Use fallback workspace data
        workspaceData = {
          id: workspaceId,
          name: 'Workspace',
          type: 'PERSONAL'
        };
      }
    } catch (error) {
      console.error('Error verifying workspace access:', error);
      usingFallback = true;
      // Use fallback workspace data
      workspaceData = {
        id: workspaceId,
        name: 'Workspace',
        type: 'PERSONAL'
      };
    }
    
    // Render the client workspace layout with available data
    // Wrap with SocketProvider for enhanced socket functionality
    return (
      <SocketProvider workspaceId={workspaceId}>
        {usingFallback && (
          <div className="bg-amber-50 border-b border-amber-200 p-2">
            <p className="text-amber-700 text-sm text-center">
              Using limited functionality mode due to temporary service issues.
            </p>
          </div>
        )}
        <ClientWorkspaceLayout 
          workspaceId={workspaceId}
          workspace={workspaceData}
          initialWorkspaces={workspaces}
          initialNotifications={notifications}
          degradedMode={usingFallback}
        >
          {children}
        </ClientWorkspaceLayout>
      </SocketProvider>
    );
  } catch (error) {
    // If anything fails, show a simple fallback UI
    console.error('Error in enhanced layout:', error);
    
    // Still provide SocketProvider even in error state to enable basic functionality
    return (
      <SocketProvider workspaceId={workspaceId}>
        <div className="p-4">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
            <h2 className="text-amber-800 font-medium">Limited Access Mode</h2>
            <p className="text-amber-700 text-sm">
              We're experiencing issues. Some features may be unavailable.
              Try again later or refresh the page.
            </p>
          </div>
          
          <div className="bg-white rounded-md shadow p-4">
            {children}
          </div>
        </div>
      </SocketProvider>
    );
  }
}
