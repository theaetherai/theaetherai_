'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { RotateCw } from 'lucide-react'

const RefreshButton = () => {
  return (
    <Button 
      variant="outline"
      className="flex items-center gap-2"
      onClick={() => window.location.reload()}
    >
      <RotateCw className="h-4 w-4" />
      Refresh Page
    </Button>
  );
};

export default RefreshButton; 