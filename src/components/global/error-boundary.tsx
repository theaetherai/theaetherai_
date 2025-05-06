'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ExclamationTriangleIcon, ReloadIcon } from '@radix-ui/react-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  isDatabaseError?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component to catch JavaScript errors anywhere in the child component tree
 * and display a fallback UI instead of crashing the whole application.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error', error, errorInfo);
    this.setState({ errorInfo });
  }

  isDatabaseError(): boolean {
    // Check if the error is related to database connection
    if (this.props.isDatabaseError) return true;
    
    const errorMessage = this.state.error?.message || '';
    return (
      errorMessage.includes('database') ||
      errorMessage.includes('prisma') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('neon.tech') ||
      errorMessage.includes('ECONNREFUSED')
    );
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback was provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Determine if this is a database error
      const isDatabaseError = this.isDatabaseError();

      return (
        <div className="p-6 border-2 border-border/60 rounded-lg bg-background shadow-md">
          <Alert variant="destructive" className="mb-6">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            <AlertTitle className="text-lg">
              {isDatabaseError 
                ? 'Database Connection Error' 
                : 'Something went wrong'}
            </AlertTitle>
            <AlertDescription className="mt-2">
              {isDatabaseError
                ? 'We are currently experiencing issues connecting to our database. This is likely a temporary problem.'
                : 'An unexpected error occurred while rendering this component.'}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {process.env.NODE_ENV === 'development' && (
              <div className="p-4 bg-muted rounded-md overflow-auto">
                <p className="font-mono text-sm mb-2">{this.state.error?.toString()}</p>
                {this.state.errorInfo && (
                  <pre className="font-mono text-xs overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="flex items-center gap-1"
              >
                <ReloadIcon className="h-4 w-4 mr-1" />
                Refresh Page
              </Button>
              <Button onClick={this.handleReset}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 